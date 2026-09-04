import KN.HyperPeel
import KN.HyperProjGen
import KN.HyperTransfer

/-!
# The ported gate 1 chain, composed

Three agents ported adjacent layers of the bond development independently.  This file checks that
they compose, by deriving the surplus transfer inequality from the conditioned-slack hierarchy
`CSHHolds` alone.  The point is to isolate what gate 1 still needs: after this, the only
hypergraph input missing below the fixed-minimiser comparison is `CSHHolds` itself.
-/

namespace KNAll.Site

open Percolation.Literature.LatticeModels

/-- The surplus transfer inequality, from the conditioned-slack hierarchy. -/
theorem surplusTransfer_of_csh {V E : Type*} [Fintype V] [Fintype E] (H : Hypergraph V E)
    (hw : ∀ e, 0 < H.prob e ∧ H.prob e < 1) (Y : Set V) (T : Finset V) (o v : V)
    (F : Set V → ℝ) (r : V → ℕ)
    (hF : ∀ S S' : Set V, S ⊆ S' → F S ≤ F S')
    (hvY : v ∉ Y) (hvT : v ∉ T)
    (haT : ∀ a ∈ T, a ∉ Y) (hr : Set.InjOn r ↑T)
    (hcompat : ∀ b ∈ T, ∀ b' ∈ T, r b < r b' → condMeanY H Y F b ≤ condMeanY H Y F b')
    (hCSH : ∀ (x : V) (Y' : Set V) (D : List V), x ∉ Y' → o ≠ x → v ≠ x →
      o ∉ Y' → v ∉ Y' → D.Nodup → (∀ d ∈ D, d ≠ x ∧ d ∉ Y' ∧ d ≠ o ∧ d ≠ v) →
      CSHHolds H x Y' D o v) :
    (prodBernoulli H.prob).real (avoidEvent H {v} (Y ∪ ↑T) ∩ hyperConn H o v) *
        avoidSurplus H Y T r F v
      ≤ (prodBernoulli H.prob).real (avoidEvent H {v} (Y ∪ ↑T)) * avoidSurplus H Y T r F o := by
  -- `o ∉ Y` and `o ∉ T` are not assumed: the transfer takes the margin as an implication, so
  -- they are bound here.  Assuming them at top level is what stopped this composing with
  -- `genY_of_surplusTransferY`, whose hypothesis supplies `v ∉ T` but not `o ∉ T`.
  refine avoidSurplusTransfer_nondegenerate_of_margin H hw Y T o v F r hvY hvT hr hcompat ?_
  intro hoY hoT _
  have h := surplusMarginY_nonneg_of_csh H hw Y o v hoY hvY hCSH T r [] F hF hr hcompat haT hoT hvT
    List.nodup_nil (by simp)
  rw [surplusMarginY_nil] at h
  -- `avoidSurplus` and `surplusY` are the same definition, written by two agents; `exact`
  -- checks up to definitional equality, so no bridging lemma is needed.
  exact h

/-- **(GEN) from the conditioned-slack hierarchy.**  The surplus transfer produced above has
exactly the shape `genY_of_surplusTransferY` consumes, so a hierarchy holding at every pair of
endpoints yields the generalised inequality for every relay set. -/
theorem genY_of_csh {V E : Type*} [Fintype V] [Fintype E] (H : Hypergraph V E)
    (hw : ∀ e, 0 < H.prob e ∧ H.prob e < 1) (Y : Set V) (F : Set V → ℝ)
    (hF : ∀ S S' : Set V, S ⊆ S' → F S ≤ F S')
    (hCSH : ∀ (x : V) (Y' : Set V) (D : List V) (o v : V), x ∉ Y' → o ≠ x → v ≠ x →
      o ∉ Y' → v ∉ Y' → D.Nodup → (∀ d ∈ D, d ≠ x ∧ d ∉ Y' ∧ d ≠ o ∧ d ≠ v) →
      CSHHolds H x Y' D o v) :
    ∀ (A : Finset V) (o : V) (r : V → ℕ),
      (∀ a ∈ A, a ∉ Y) →
      (∀ a ∈ A, 0 < (prodBernoulli H.prob).real (avoidEvent H ({a} : Set V) Y)) →
      Set.InjOn r ↑A →
      (∀ b ∈ A, ∀ b' ∈ A, r b < r b' → condMeanY H Y F b ≤ condMeanY H Y F b') →
      0 ≤ surplusY H Y A r F o := by
  refine genY_of_surplusTransferY H Y F hF ?_
  intro T o v r haT _ hvY hvT hr hcompat
  exact surplusTransfer_of_csh H hw Y T o v F r hF hvY hvT haT hr hcompat
    (fun x Y' D => hCSH x Y' D o v)

end KNAll.Site
