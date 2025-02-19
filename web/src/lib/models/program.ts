import type {
  Statement,
  ParticipantStatement,
  SendStatement,
  MatchStatement,
  KnowledgeItem,
  Type,
  FormatItem,
  Expression,
  MatchCase,
  KeyRelation,
  ClearStatement,
  Program as ProgramAST,
  NewStatement,
  SetStatement,
  MessageSendStatement,
  EncryptExpression,
  SignExpression,
  Participants,
  Knowledge,
  KeyRelations,
  FunctionsDef,
  Format,
  Icons,
  Protocol,
  Equations,
  Equation,
  StmtComment,
  ParticipantItem,
  Id,
} from "$lang/types/parser/interfaces";
import { getSimpleStringFromExpression, getStringFromType } from "$lib/utils/stringUtil";
import HistoryTemplates from "$lib/utils/HistoryEnum";
import { Frame } from "./Frame";
import { FormatMap } from "./FormatMap";
import { ParticipantMap } from "./ParticipantMap";
import { z } from "zod";
import type { ParticipantKnowledge } from "src/types/participant";
import { KnowledgeHandler } from "./KnowledgeHandler";
import type { Participant } from "./Participant";

export class Program {
  init_participants: ParticipantMap = new ParticipantMap();

  first: Frame | null = null;

  formats: FormatMap = new FormatMap();
  knowledgeHandler = new KnowledgeHandler();
  icons: Map<string, string> = new Map();
  log = false;

  constructor(json: ProgramAST, log = false) {
    this.log = log;
    if (this.log) console.log("Program started!");

    // Check if json is valid
    if (json.type != "program") {
      throw new Error("Invalid json");
    }

    // Participants:
    this.constructParticipants(json.participants);
    if (this.log) console.log("Participants", this.init_participants);

    // Knowledge:
    this.constructKnowledge(json.knowledge);

    // KeyRelations:
    this.constructKeyRelations(json.keyRelations);

    // Functions:
    this.constructFunctions(json.functions);

    // Equations:
    this.constructEquations(json.equations);

    // Format:
    // Add format to functions
    this.constructFormat(json.format);

    // Icons:
    this.constructIcons(json.icons);

    // Protocol & Frames:
    this.constructProtocol(json.protocol);

    if (this.log) console.log("Program created");
  }

  // Construct Participants
  constructParticipants(participants: Participants) {
    // Add given participants
    if (participants) {
      if (this.log) console.log(participants.participants);
      if (participants.participants.length > 8) {
        throw new Error("More than 8 participants are not supported");
      }
      participants.participants.forEach((participant: ParticipantItem) => {
        this.init_participants.addParticipant(participant.id.value, participant.comment);
      });
      if (this.log) console.log("Participants created", this.init_participants);
    } else if (this.log) console.log("No participants found");

    // Add shared knowledge
    this.init_participants.addParticipant("Shared");
    this.knowledgeHandler.setSharedKnowledge(this.init_participants.getParticipant("Shared"));
  }

  // Construct Knowledge
  constructKnowledge(knowledge: Knowledge) {
    //Add given knowledge to participants
    if (knowledge) {
      knowledge.knowledge.forEach((knowledge: KnowledgeItem) => {
        knowledge.children.forEach((child: { value: Type; comment?: StmtComment }) => {
          this.init_participants.setKnowledgeOfParticipant(knowledge.id.value, {
            type: "rawKnowledge",
            knowledge: child.value,
            comment: child.comment,
          });
        });
      });
      if (this.log) console.log("Knowledge added to participants", this.init_participants);
    } else if (this.log) console.log("No knowledge found");
  }

  // Construct KeyRelations
  constructKeyRelations(keyRelations: KeyRelations) {
    if (keyRelations) {
      keyRelations.keyRelations.forEach((keyRelation: KeyRelation) => {
        const sk = keyRelation.sk.value;
        const pk = keyRelation.pk.value;
        this.knowledgeHandler.addKeyRelation(pk, sk);
      });
      if (this.log) console.log("KeyRelations created", this.knowledgeHandler.getKeyRelations());
    } else if (this.log) console.log("No keyRelations found");
  }

  constructFunctions(functions: FunctionsDef) {
    if (functions) {
      functions.functions.forEach((func: Id) => this.knowledgeHandler.addOpaqueFunction(func.value));
      if (this.log) console.log("Functions created", this.knowledgeHandler.getOpaqueFunctions());
    } else if (this.log) console.log("No functions found");
  }

  constructEquations(equations: Equations) {
    if (equations) {
      equations.equations.forEach((eq: Equation) => this.knowledgeHandler.getEquations().addEquation(eq.left, eq.right));
      if (this.log) console.log("Equations created", this.knowledgeHandler.getEquations().getEquations());
    } else if (this.log) console.log("No Equations found");
  }

  constructFormat(format: Format) {
    if (format) {
      format.formats.forEach((format: FormatItem) => {
        if (format.format.type == "Tex") this.formats.addTex(format.id, format.format.value);
        else if (format.format.type == "string") this.formats.addString(format.id, format.format.value);
      });

      if (this.log) console.log("Formats created", this.formats);
    } else if (this.log) console.log("No formats found");
  }

  constructIcons(icons: Icons) {
    if (icons) {
      this.icons = icons.icons;
      if (this.log) console.log("Icons created", this.icons);
    } else if (this.log) console.log("No icons found");
  }

  constructProtocol(protocol: Protocol) {
    //Setup first frame
    this.first = new Frame(null, null, this.init_participants, []);
    if (this.log) console.log("First frame created", this.first);
    if (this.first == null) throw new Error("Invalid json: no first frame created! First frame not properly initialized");

    if (protocol.statements) {
      this.parseStatements(protocol.statements, this.first);
      if (this.log) console.log("Protocol created", this.first);
    } else if (this.log) console.log("No protocol found");
  }

  // Check whether a statement is a match statement or not, and call the correct parse function (parseMatchStmnt/parseStmnt)
  parseStatements(stmntList: Statement[], last: Frame) {
    //Get next statement
    const stmnt = stmntList.shift();
    if (stmnt == undefined) throw new Error("Invalid json: stmnt is undefined! Check if statements array is empty (parseProtocol)");

    //Check if statement is a match statement
    if (this.isMatchStatement(stmnt)) {
      this.parseMatchStmnt(stmnt, stmntList, last);
    } else {
      this.parseStmnt(stmnt, stmntList, last);
    }
  }

  // Parse a match statement and add it to the last frame, then call parseStatements on the remaining statements in stmntList
  parseMatchStmnt(stmnt: Statement, stmntList: Statement[], last: Frame) {
    last.setNext({});
    const sendStatement: SendStatement = stmnt.child as SendStatement;
    const sender = sendStatement.leftId.value;
    const receiver = sendStatement.rightId.value;
    const matchStatement: MatchStatement = sendStatement.child as MatchStatement;
    const matchFrame = Frame.newFrame(stmnt, last.getParticipantMap(), last);

    last.setNext(matchFrame);
    for (const caseIndex in matchStatement.cases) {
      const matchCase: MatchCase = matchStatement.cases[caseIndex];
      const identifier = getStringFromType(matchCase.case);
      const firstStmnt = matchCase.children.shift();
      if (firstStmnt) {
        matchFrame.createNewMatchCase(firstStmnt, identifier);
        matchFrame
          .getNextFrame(identifier)
          .addToHistory(HistoryTemplates.matchCase(identifier), `${sender} ->> ${receiver}: ${identifier}`); //We need duplicate since the pipeStmnt will add the first statement to the history
        this.pipeStmnt(firstStmnt, matchFrame.getNextFrame(identifier) as Frame);
      } else {
        matchFrame.createNewMatchCase(null, identifier);
        matchFrame
          .getNextFrame(identifier)
          .addToHistory(HistoryTemplates.matchCase(identifier), `${sender} ->> ${receiver}: ${identifier}`);
      }
      //Branch out for each case and concat the remaining statements on the case children
      this.parseStatements(matchCase.children.concat(stmntList), matchFrame.getNextFrame(identifier));
    }
  }

  // Parse a statement and add it to the last frame, then call parseStatements on the remaining statements in stmntList
  parseStmnt(stmnt: Statement, stmntList: Statement[], last: Frame) {
    last.setNext(Frame.newFrame(stmnt, last.getParticipantMap(), last));
    this.pipeStmnt(stmnt, last.getNext() as Frame);

    if (last.isNextNull()) throw new Error("Invalid json: next frame not properly initialized! (parseProtocol)");
    if (stmntList.length > 0) {
      const next = z.instanceof(Frame).safeParse(last.getNext());
      if (next.success) {
        this.parseStatements(stmntList, next.data);
      } else {
        throw new Error("Invalid json: next frame not properly initialized! (parseProtocol)");
      }
    }
  }

  // Return true if the statement is a match statement, false otherwise
  isMatchStatement(stmnt: Statement): boolean {
    if (stmnt.child.type !== "sendStatement") return false;
    const send = stmnt.child as SendStatement;
    return send.child.type == "matchStatement";
  }

  // Check what the type of the given statement is and calls the correct function to add it to the last frame
  pipeStmnt(stmnt: Statement, last: Frame) {
    if (this.log) console.log("Piping statement", stmnt);

    switch (stmnt.child.type) {
      case "clearStatement": {
        const clearStmt = stmnt.child as ClearStatement;
        this.clearStmnt(clearStmt.id, last);
        break;
      }
      case "participantStatement": {
        const participantStmt = stmnt.child as ParticipantStatement;
        this.participantStmnt(participantStmt, last);
        break;
      }
      case "sendStatement": {
        const sendStmt = stmnt.child as SendStatement;
        this.sendStmnt(sendStmt, last);
        break;
      }
      default:
        throw new Error("Invalid json: stmnt type not found!");
    }
  }

  clearStmnt(knowledge: Type, last: Frame) {
    last.getParticipantMap().clearKnowledgeElement({ type: "rawKnowledge", knowledge: knowledge });
    const involvedParticipants = last
      .getParticipantMap()
      .getParticipantsNames()
      .filter((s) => s !== "Shared");
    let mermaidMsg = "";
    const firstParticipant = involvedParticipants[0];
    const lastParticipant = involvedParticipants[involvedParticipants.length - 1];
    if (involvedParticipants.length > 1)
      mermaidMsg = `Note over ${firstParticipant}, ${lastParticipant}: Clear ${getStringFromType(knowledge)}`;
    else mermaidMsg = `Note over ${firstParticipant}: Clear ${getStringFromType(knowledge)}`;
    last.addToHistory(HistoryTemplates.clear(knowledge, this), mermaidMsg);
  }

  // Check what the type of the given participant statement is and calls the correct function
  participantStmnt(stmnt: ParticipantStatement, last: Frame) {
    // Pipe ParticipantStatement
    if (stmnt.child.type == "newStatement") {
      const newStmnt = stmnt.child as NewStatement;
      this.newStmnt(stmnt.id.value, newStmnt.value, last, newStmnt.comment);
    } else if (stmnt.child.type == "setStatement") {
      const sendStmnt = stmnt.child as SetStatement;
      this.setStmnt(stmnt.id.value, sendStmnt.id, sendStmnt.value, last);
    } else {
      throw new Error("Invalid json: stmnt child type not implemented");
    }
  }

  // New Statement
  newStmnt(participant: string, newKnowledge: Type, last: Frame, comment?: StmtComment) {
    last.getParticipantMap().setKnowledgeOfParticipant(participant, { type: "rawKnowledge", knowledge: newKnowledge, comment: comment });

    this.knowledgeHandler.recheckEncryptedKnowledge(last.getParticipantMap().getParticipant(participant));
    last.addToHistory(
      HistoryTemplates.new(participant, newKnowledge, this),
      `Note over ${participant}: New ${getStringFromType(newKnowledge)}`,
    );
  }

  // Set Statement
  setStmnt(participant: string, knowledge: Type, value: Type, last: Frame) {
    last.getParticipantMap().setKnowledgeOfParticipant(participant, {
      type: "rawKnowledge",
      knowledge: knowledge,
      value: value,
    });
    this.knowledgeHandler.recheckEncryptedKnowledge(last.getParticipantMap().getParticipant(participant));
    last.addToHistory(
      HistoryTemplates.set(participant, knowledge, value, this),
      `Note over ${participant}: ${getStringFromType(knowledge)} = ${getStringFromType(value)}`,
    );
  }

  // Pipe SendStatement to messageSendStatement, or matchStatement
  sendStmnt(stmnt: SendStatement, last: Frame) {
    if (stmnt.child.type == "messageSendStatement") {
      const messageSendStmnt = stmnt.child as MessageSendStatement;
      this.messageSendStmnt(stmnt.leftId.value, stmnt.rightId.value, messageSendStmnt.expressions, last, true);
    } else {
      throw new Error("Invalid json: stmnt child type not implemented");
    }
  }

  // Pipe MessageSendStatement to encryptExpression, signExpression, or setStatement
  messageSendStmnt(senderId: string, receiverId: string, knowledge: Expression[], last: Frame, canDescrypt: boolean) {
    knowledge.forEach((expression) => {
      last.addToHistory(
        HistoryTemplates.send(senderId, receiverId, expression, this),
        `${senderId} ->> ${receiverId}: ${getSimpleStringFromExpression(expression)}`,
      );
      const sender: Participant = last.getParticipantMap().getParticipant(senderId);
      const receiver: Participant = last.getParticipantMap().getParticipant(receiverId);
      const sentKnowledge = this.generateKnowledgeElement(expression, sender, receiver, last, canDescrypt);
      sentKnowledge.forEach((knowledge) => {
        this.knowledgeHandler.transferKnowledge(last.getParticipantMap(), senderId, receiverId, knowledge);
      });
    });
  }

  generateKnowledgeElement(
    expression: Expression,
    sender: Participant,
    receiver: Participant,
    last: Frame,
    canDecrypt = true,
  ): ParticipantKnowledge[] {
    if (expression.child.type == "encryptExpression") {
      const encryptedExpression = expression.child as EncryptExpression;
      return this.generateEncryptedKnowledge(sender, receiver, encryptedExpression.inner, encryptedExpression.outer, last, canDecrypt);
    } else if (expression.child.type == "signExpression") {
      const signExpression = expression.child as SignExpression;
      let subKnowledge: ParticipantKnowledge[] = [];
      signExpression.inner.forEach((expression) => {
        subKnowledge = subKnowledge.concat(this.generateKnowledgeElement(expression, sender, receiver, last, canDecrypt));
      });
      return subKnowledge;
    } else {
      const type = expression.child as Type;
      return [sender.getRawParticipantKnowledge(type)];
    }
  }

  // Acoomodate encryption of knowledge in messages
  generateEncryptedKnowledge(
    sender: Participant,
    receiver: Participant,
    inner: Expression[],
    outer: Type,
    last: Frame,
    canDecrypt = true,
  ): ParticipantKnowledge[] {
    // if receiver was unable to decrypt an outer expression earlier, it cannot be decrypted now
    // decryptable = true if receiver knows the key, it is therefore not encrypted
    const knowledgeOuter = sender.getRawParticipantKnowledge(outer);

    canDecrypt = canDecrypt && this.knowledgeHandler.doesParticipantKnowKey(receiver, knowledgeOuter);

    let knowledges: ParticipantKnowledge[] = [];
    inner.forEach((expression) => {
      knowledges = knowledges.concat(this.generateKnowledgeElement(expression, sender, receiver, last, canDecrypt));
    });

    if (canDecrypt) return knowledges;
    else {
      return [{ type: "encryptedKnowledge", knowledge: knowledges, encryption: knowledgeOuter }];
    }
  }

  getIcons() {
    return this.icons;
  }

  getIcon(id: string) {
    return this.icons.get(id) || "red-question-mark";
  }

  getFormats() {
    return this.formats;
  }
}
