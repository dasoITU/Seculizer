//import "../../../Language/dist/dist/dts/parser/interfaces"
import type { Participant, Statement, ParticipantStatement, 
    SendStatement,
    SetStatement,
    MessageSendStatement,
    MatchStatement,
    KnowledgeItem,
    Id,
    Type,
    FunctionDefItem,
    FormatItem} from '$lang/types/parser/interfaces';


type _participant = {
    name: string
    knowledge: _knowledge[]
}

type _knowledge = {
    id: string
    value: string
}

type participantMap = {[id: string]: _participant}

type frame = {
    next : frame | {[id: string]: frame}
    prev : frame
    participants :  participantMap
    presentation : Statement
} | null

type _format = {
    //Function
    id: string
    params: string[]

    //Latex
    latex: string
}

export class Program {
    init_participants: participantMap = {}

    first : frame = null
    last : frame = null

    keyRelations: {[id: string]: string} = {}
    functions: {[id: string]: Number} = {}
    formats: {[id: string]: _format} = {}
    equations: {[id: string]: string} = {}
    icons: {[id: string]: string} = {}

    constructor(json: any, log: boolean = false) {
        if (log) console.log("Program started!");

        // Check if json is valid
        if (json.type != "program" ) {
            throw new Error("Invalid json")
        }

        // Participants:
        // Create participants
        if (json.participants){
            json.participants.participants.forEach((participant: Participant) => {
                this.init_participants[participant.id.value] = {
                    name: participant.id.value,
                    knowledge: []
                }
            })
            if (log) console.log("Participants created", this.init_participants);
        } else if (log) console.log("No participants found");
        

        // Add shared knowledge
        this.init_participants["Shared"] = {
            name: "Shared",
            knowledge: []
        }

        // Knowledge:
        // Add knowledge to participants
        if (json.knowledge){
            json.knowledge.knowledge.forEach((knowledge: KnowledgeItem) => {
                knowledge.children.forEach((child: Type) => {
                    if (child.type == "function") throw new Error("Invalid json: stmnt child value type not implemented");
                    else {
                        this.init_participants[knowledge.id.value].knowledge.push({
                            id: String(child.value),
                            value: ""
                        })
                    }
                })
            })
            if (log) console.log("Knowledge added to participants", this.init_participants);
        } else if (log) console.log("No knowledge found");
        


        // KeyRelations:
        if (json.keyRelations){
            json.keyRelations.keyRelations.forEach((keyRelation: any) => 
                this.keyRelations[keyRelation.name] = keyRelation.value
            )
            if (log) console.log("KeyRelations created", this.keyRelations);
        } else if (log) console.log("No keyRelations found");

        // Functions:
        if (json.functions){
            json.functions.functions.forEach((func: FunctionDefItem) =>
                this.functions[func.id.value] = func.params
            )
            if (log) console.log("Functions created", this.functions);
        } else if (log) console.log("No functions found");


        // Equations:
        if (json.equations) {
            json.equations.equations.forEach((equation: any) => {
                let tmp_equation = equation.left.latex
                equation.right.params.forEach((param: any) => {
                    tmp_equation = tmp_equation.replace(param.id, param.value)
                })
                this.equations[equation.left.id] = tmp_equation
            })
            if (log) console.log("Equations created", this.equations);
        } else if (log) console.log("No equations found");

        // Format:
        // Add format to functions
        if (json.format){
            json.format.formats.forEach((format: FormatItem) => {

                let tmp_format : _format = {
                    id: format.function.id,
                    params: [],
                    latex: format.format.value
                }

                format.function.params.forEach((param: Type) => {
                    if (param.type == "function") throw new Error("Invalid json: stmnt child value type not implemented");
                    else tmp_format.params.push(String(param.value));
                })

                this.formats[format.function.id] = tmp_format

            })

            if (log) console.log("Formats created", this.formats);
        } else if (log) console.log("No formats found");


        // Icons:
        if (json.icons){
            this.icons = json.icons.icons
            if (log) console.log("Icons created", this.icons);
        } else if (log) console.log("No icons found");

        //Setup first frame
        this.newFrame(null, this.init_participants)
        
        // Protocol:

        if (json.protocol.statements){
            json.protocol.statements.forEach( (stmnt: Statement) => {
                let tmp_participants = this.last?.participants
                tmp_participants = this.pipeStmnt(stmnt, tmp_participants)
                this.newFrame(stmnt, tmp_participants)
            });
        } else if (log) console.log("No protocol found");
        
        console.log("Program created");
    }

    newFrame(stmnt : any, participants: participantMap){
        let oldLast = this.last;
        this.last = {
            next: null,
            prev: oldLast,
            participants: participants,
            presentation: stmnt
        }
        if (oldLast) oldLast.next = this.last
        else this.first = this.last
    }

    pipeStmnt(stmnt: Statement, participants: participantMap | undefined) : participantMap{
        if (!participants) throw new Error("Invalid json: participants is undefined");

        switch (stmnt.child.type) {
            case "clearStatement":
                return this.clearStmnt(stmnt.child.id.value, participants)
            case "participantStatement":
                return this.participantStmnt(stmnt.child, participants)
                // TODO: create methond for newStatement
            case "sendStatement":
                return this.sendStmnt(stmnt.child, participants)
                // TODO: create methond for newStatement
            default:
                throw new Error("Invalid json: stmnt type not found");    
        }
    }

    clearStmnt(knowledge: string, participants: participantMap) : participantMap{
        Object.keys(participants).forEach((participant: string) => {
            participants[participant].knowledge =  participants[participant].knowledge.filter(
                                                            (item: _knowledge) => item.id != knowledge
                                                        )
        })
        return participants;
    }

    participantStmnt(stmnt : ParticipantStatement, participants: participantMap) : participantMap{        
        // Pipe ParticipantStatement
        if (stmnt.child.type == "newStatement"){
            return this.newStmnt(stmnt.id.value, stmnt.child.id.value, participants)
        } else if (stmnt.child.type == "setStatement"){
            if (stmnt.child.value.type == "function") throw new Error("Invalid json: stmnt child value type not implemented");
            else return this.setStmnt(stmnt.id.value, stmnt.child.id.value, String(stmnt.child.value.value), participants)
        } else {
            throw new Error("Invalid json: stmnt child type not implemented");
        }
    }

    newStmnt(participant : string, newKnowledge : string, participants: participantMap) : participantMap{
        participants[participant].knowledge.push({
            id: newKnowledge,
            value: ""
        })
        return participants
    }

    setStmnt(participant : string, knowledge : string, value : string, participants: participantMap) : participantMap{
        let index = participants[participant].knowledge.findIndex((element) => element.id == knowledge)

        participants[participant].knowledge[index] = {
            id: knowledge,
            value: value
        }

        return participants
    }

    sendStmnt(stmnt : SendStatement, participants: participantMap) : participantMap{
        // Pipe SendStatement
        if (stmnt.child.type == "messageSendStatement"){
            return this.messageSendStmnt(stmnt.child, participants)
        } else if (stmnt.child.type == "matchStatement"){
            return this.matchStmnt(stmnt.child, participants)
        } else {
            throw new Error("Invalid json: stmnt child type not implemented");
        }
    }

    messageSendStmnt(stmnt : MessageSendStatement, participants: participantMap) : participantMap{
        return participants
    }

    matchStmnt(stmnt : MatchStatement, participants: participantMap) : participantMap{
        return participants
    }
    
}

