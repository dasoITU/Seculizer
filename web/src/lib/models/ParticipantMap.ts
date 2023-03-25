import type { Statement, Type } from "$lang/types/parser/interfaces";
import { Participant, type knowledge } from "./Participant";

export class ParticipantMap {
  private participants: { [id: string]: Participant } = {};

  constructor(participants: { [id: string]: Participant } = {}) {
    Object.keys(participants).forEach(
      (participant: string) =>
        (this.participants[participant] = new Participant(participant, participants[participant].cloneKnowledgeList()))
    );
  }

  getParticipants(): { [id: string]: Participant } {
    return this.participants;
  }

  getParticipantsNames(): string[] {
    return Object.keys(this.participants);
  }

  getParticipantAmount(): number {
    return Object.keys(this.participants).length;
  }

  getParticipant(name: string): Participant {
    return this.participants[name];
  }

  // Add participant to map
  addParticipant(name: string, knowledge: knowledge[] = []) {
    this.participants[name] = new Participant(name, knowledge);
  }

  // Insert given knowledge into given participant or update existing knowledge
  setKnowledgeOfParticipant(participant: string, knowledge: Type, encrypted: boolean, value: string = "") {
    this.participants[participant].setKnowledge(knowledge, encrypted, value);
  }

  // Find value of knowledge of participant
  findKnowledgeValue(participant: string, knowledge: Type): string {
    return this.participants[participant].getKnowledge(knowledge).value;
  }

  // Check if participant has knowledge of given key
  checkKeyKnowledge(participant: string, key: Type): boolean {
    return this.participants[participant].doesKnowledgeExist(key);
  }

  clearKnowledgeElement(elem: Type) {
    Object.keys(this.participants).forEach((participant: string) => this.participants[participant].clearKnowledgeElement(elem));
  }

  transferKnowledge(sender: string, receiver: string, knowledge: Type, encrypted: boolean | null = null) {
    // Error handling
    if (sender == receiver) throw new Error("Sender and receiver cannot be the same! You cannot send something to yourself!");
    if (!this.participants[sender]) throw new Error("Sender not found!");
    if (!this.participants[receiver]) throw new Error("Receiver not found!");

    if (knowledge.type == "string" || knowledge.type == "number") return;

    let tmp_knowledge = this.participants[sender].getKnowledge(knowledge);

    this.participants[receiver].setKnowledge(tmp_knowledge.id, encrypted == null ? tmp_knowledge.encrypted : encrypted, tmp_knowledge.value);
  }
}
