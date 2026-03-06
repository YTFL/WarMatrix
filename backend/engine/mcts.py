"""Adversarial MCTS implementation.

This MCTS alternates player and enemy turns:
Player -> Enemy -> Player -> Enemy ...

Phases implemented with comments:
- Selection: traverse tree using UCT, with enemy nodes preferring to minimize
  the player's expected reward (we flip exploit sign for enemy nodes).
- Expansion: add one new child (untried player action OR sampled enemy action).
- Simulation (rollout): run random alternation for a fixed depth and return the
  final `success_probability` (player's reward in [0,1]).
- Backpropagation: propagate reward back up the tree. Selection uses visits/value
  to compute UCT; at the root we return the best player action (highest visits).
"""

from copy import deepcopy
import math
import random
from typing import Optional

import numpy as np

from .actions import ACTIONS
from .enemy_model import enemy_action
from .transition import apply_action, apply_enemy_action
from .probability import compute_success_probability


EPS = 1e-6


class Node:
    def __init__(self, state, parent=None, action: Optional[str] = None, player_turn: bool = True):
        self.state = state  # GameState
        self.parent = parent
        self.children = []
        self.visits = 0
        self.value = 0.0  # cumulative reward (player's perspective)
        self.action = action  # action that led to this node
        self.player_turn = player_turn  # True if this node is a player node

    def is_fully_expanded(self):
        if self.player_turn:
            return len(self.children) >= len(ACTIONS)
        # enemy nodes are expanded by sampling; treat not fully expanded
        return False

    def best_child(self, c: float = 1.4):
        """Select child using UCT. For enemy nodes we invert the exploit term
        so the enemy prefers children that minimize the player's reward.
        """
        best_score = -float("inf")
        best = None
        for child in self.children:
            exploit = child.value / (child.visits + EPS)
            explore = c * math.sqrt(math.log(self.visits + 1) / (child.visits + EPS))
            if self.player_turn:
                score = exploit + explore
            else:
                # enemy prefers lower exploit -> invert exploit
                score = -exploit + explore
            if score > best_score:
                best_score = score
                best = child
        return best

    def expand(self):
        """Expand one untried action. If player_turn, try next player action.
        If enemy node, sample a single enemy reaction and add that child.
        Returns the new child or None if cannot expand.
        """
        if self.player_turn:
            tried = {c.action for c in self.children}
            for action in ACTIONS:
                if action not in tried:
                    new_state = deepcopy(self.state)
                    new_state = apply_action(new_state, action)
                    child = Node(new_state, parent=self, action=action, player_turn=False)
                    self.children.append(child)
                    return child
            return None
        else:
            # sample an enemy action once during expansion
            e = enemy_action()
            new_state = deepcopy(self.state)
            new_state = apply_enemy_action(new_state, e)
            child = Node(new_state, parent=self, action=e, player_turn=True)
            self.children.append(child)
            return child


def rollout(state, depth: int = 6) -> float:
    """Rollout simulating alternating turns randomly for `depth` plies.

    Returns final success_probability (player reward).
    """
    sim_state = deepcopy(state)
    player_turn = True
    for _ in range(depth):
        if player_turn:
            # random player action (uses the global random module; seed set in run_mcts)
            action = random.choice(ACTIONS)
            sim_state = apply_action(sim_state, action)
        else:
            e = enemy_action()
            sim_state = apply_enemy_action(sim_state, e)
        # update success_probability each step based on state
        sim_state.success_probability = compute_success_probability(sim_state)
        player_turn = not player_turn
    return float(sim_state.success_probability)


def backpropagate(node: Node, reward: float):
    """Propagate reward up to the root. Reward is always from player's perspective.
    We simply accumulate value and visits; selection handles minimization at enemy nodes.
    """
    while node is not None:
        node.visits += 1
        node.value += reward
        node = node.parent


def run_mcts(root_state, iterations: int = 400, seed: int = None) -> Optional[str]:
    """Run adversarial MCTS starting from root_state (player to move by default).

    Returns the best player action (string) chosen among root children.
    """
    # Seed global RNGs for deterministic behavior when seed provided
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    root = Node(root_state, parent=None, action=None, player_turn=True)

    for _ in range(iterations):
        node = root
        # Selection
        while node.children and node.is_fully_expanded():
            node = node.best_child()
        # Expansion
        child = node.expand()
        if child is None:
            # nothing to expand
            continue
        # Simulation
        reward = rollout(child.state, depth=6)
        # Backpropagation
        backpropagate(child, reward)

    # choose best player action from root children
    if not root.children:
        return None
    # pick child with highest visit count
    best = max(root.children, key=lambda c: c.visits)
    return best.action
