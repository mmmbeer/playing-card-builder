"use client";

import { useReducer } from "react";
import type { DeckSettings } from "./types";

type Updater = (deck: DeckSettings) => DeckSettings;
type State = {
  continuous: boolean;
  future: DeckSettings[];
  past: DeckSettings[];
  present: DeckSettings;
};
type Action =
  | { type: "begin" }
  | { type: "commit"; updater: Updater }
  | { type: "end" }
  | { type: "live"; updater: Updater }
  | { type: "redo" }
  | { type: "replace"; deck: DeckSettings }
  | { type: "undo" };

const HISTORY_LIMIT = 50;

function append(items: DeckSettings[], deck: DeckSettings) {
  return [...items, deck].slice(-HISTORY_LIMIT);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "begin":
      if (state.continuous) return state;
      return { ...state, continuous: true, future: [], past: append(state.past, state.present) };
    case "commit":
      return { continuous: false, future: [], past: append(state.past, state.present), present: action.updater(state.present) };
    case "end":
      return state.continuous ? { ...state, continuous: false } : state;
    case "live":
      return { ...state, present: action.updater(state.present) };
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return { continuous: false, future: state.future.slice(1), past: append(state.past, state.present), present: next };
    }
    case "replace":
      return { continuous: false, future: [], past: [], present: action.deck };
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return { continuous: false, future: [state.present, ...state.future].slice(0, HISTORY_LIMIT), past: state.past.slice(0, -1), present: previous };
    }
  }
}

export function useDeckHistory(initialDeck: DeckSettings) {
  const [state, dispatch] = useReducer(reducer, {
    continuous: false,
    future: [],
    past: [],
    present: initialDeck,
  });
  return {
    beginContinuousEdit: () => dispatch({ type: "begin" }),
    canRedo: state.future.length > 0,
    canUndo: state.past.length > 0,
    commit: (updater: Updater) => dispatch({ type: "commit", updater }),
    deck: state.present,
    endContinuousEdit: () => dispatch({ type: "end" }),
    redo: () => dispatch({ type: "redo" }),
    replaceDeck: (deck: DeckSettings) => dispatch({ type: "replace", deck }),
    updateLive: (updater: Updater) => dispatch({ type: "live", updater }),
    undo: () => dispatch({ type: "undo" }),
  };
}
