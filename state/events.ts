export enum ActionOrigin {
  User = 'user',
  AI = 'ai',
  Remote = 'remote',
}

export type BaseAction = {
  origin: ActionOrigin;
  ts?: number; // client timestamp for ordering
  actorId?: string; // uid or controller id
};

export type InputInsert = BaseAction & { type: 'input/insert'; char: string };
export type InputDelete = BaseAction & { type: 'input/delete' };
export type InputSetText = BaseAction & { type: 'input/setText'; text: string; cursorAt?: 'start' | 'end' };
export type ModeSet = BaseAction & { type: 'mode/set'; mode: 'practice' | 'guided' };
export type AIEnable = BaseAction & { type: 'ai/enable' };
export type AIDisable = BaseAction & { type: 'ai/disable' };
export type AISuggest = BaseAction & { type: 'ai/suggest'; suggestion: string };

export type ControlRequest = BaseAction & { type: 'control/request'; targetUid: string };
export type ControlGrant = BaseAction & { type: 'control/grant'; targetUid: string };
export type ControlRelease = BaseAction & { type: 'control/release' };

export type Action =
  | InputInsert
  | InputDelete
  | InputSetText
  | ModeSet
  | AIEnable
  | AIDisable
  | AISuggest
  | ControlRequest
  | ControlGrant
  | ControlRelease;

export function withMeta(action: Omit<Action, 'ts'>, actorId?: string): Action {
  return { ...action, ts: Date.now(), actorId } as Action;
}
