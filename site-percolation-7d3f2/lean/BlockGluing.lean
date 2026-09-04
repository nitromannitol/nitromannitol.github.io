import KN.SiteMacroGeometry
import KN.ReachCoupling
import KN.SiteIntrinsicInputs
import KN.GateTwoChain

/-!
# Joining the clusters of two coarse-adjacent good blocks

`KN/SiteMacroGeometry.lean` proves the one-step estimate of the block exploration and names what is
missing: nothing shows that the clusters witnessing the block events of two coarse-adjacent good
blocks are joined.  This module settles that question, and in settling it locates the obstruction
elsewhere.

## The gluing

The blocks tile, so the wall between two coarse neighbours consists of pairs of lattice neighbours,
one site of each block.  What the face-hitting event of `KN/SiteIntrinsicInputs.lean` leaves open is
which of those pairs the two clusters use.  `anchorGood N u` closes it: the centre of block `u` is
open and joined, by open paths inside that block, to all `2d` face centres of the block.  The upper
face centre of block `u` in direction `i` and the lower face centre of block `u + eᵢ` are lattice
neighbours (`anchor_adj`), and both are open once both events hold, so the two clusters are one
(`connWithin_union_of_anchorGood`).  Nothing is spent on the join: the two events are read on
disjoint sets of sites, and the connection between them is forced because both name the same pair of
facing sites.

* `siteCluster_centre_of_coarse_adj`: two coarse-adjacent anchored-good blocks have their centres in
  one open cluster.
* `siteCluster_centre_of_coarse_walk` and `infinite_siteCluster_of_coarse_walk`: a coarse path of
  anchored-good blocks is one open cluster, and an injective infinite coarse path gives an infinite
  one.
* `thetaSiteOn_pos_of_coarsePercolates`: if with positive probability the anchored-good blocks
  contain an infinite coarse path out of `u₀`, then the centre of the block `u₀` percolates.  No
  exploration, no pinned probability and no word estimate enter this.  The coarse path is quantified
  inside the event, so that it may depend on the configuration; a path fixed in advance would meet
  infinitely many independent events of probability at most `p` and have probability zero.

## Freshness survives, and so does independence

`anchorGood N u` is decided by the sites of `faceBlock N u` (`determinedBy_anchorGood`), so
`anchorSchedule` is a `BlockSchedule` with the blocks of `MacroGeom.faceSchedule`, and
`BlockSchedule.walk_nextBound` applies to it unchanged.  `anchorSchedule_nextBound` is the one-step
contract with the explicit constant `p ^ (2N+1)^d`, and `prob_biInter_anchorGood` is the exact
product formula for a finite conjunction of block events.  No region is read twice, no two block
events share a site, and no domination theorem for dependent fields is needed.

## The cost

An anchored event names a site and asks it to be open, so its probability is at most the density
(`prob_anchorGood_le`).  The classical step that raises the density of the coarse field towards `1`
by enlarging the blocks is therefore unavailable for it.  That cost is not an artefact of this
particular event: `one_sub_rho_le_param_of_runJoin` shows that the one-step contract of any
exploration meeting `RunJoin` is capped by the density as well.

## Which of the three repairs survives

* **Coalescence in a fresh corridor.**  The coalescence input is available in exactly the shape the
  repair asks for.  `coalesceAll d m M N` is a single event of `box d N`, decided by its sites
  (`determinedBy_coalesceAll`), and its probability is as close to `1` as prescribed
  (`exists_coalesceAll_prob_ge`), at the cost of a union bound over the pairs of the inner box.  It
  is still useless as a block event, and provably so: it asserts the absence of a bad pair, so the
  all-closed configuration satisfies it (`allClosed_mem_coalesceAll`), and a block whose event holds
  when nothing is open would be declared occupied in a configuration in which nothing is joined to
  anything (`not_runJoin_of_joined_next_start_eq_coalesceAll`).  What coalescence converts is a pair
  of arms into one cluster, and the two arms are not decided by the corridor; they are decided by the
  corridor together with the blocks they come from.  Naming where an arm enters the corridor is what
  would make it corridor-local, and that naming is the anchoring above, after which coalescence has
  nothing left to contribute.
* **Enlarging the good event so that adjacency is deterministic.**  This is the route taken here.  It
  works, and its cost is `prob_anchorGood_le`.
* **Overlapping regions.**  Inside this framework the price is paid before independence is reached:
  the one-step estimate itself fails.  An event that needs an open site among the sites already
  inspected has pinned probability zero at a transcript that recorded those sites closed
  (`prob_eq_zero_of_needs_open`), so the contract forces `1 ≤ rho`
  (`one_le_of_nextBound_of_needs_open`), and such a transcript is produced by the exploration itself,
  run against the all-closed configuration (`one_le_of_nextBound_of_run_needs_open`).

## Where the obstruction actually is

Gluing is not what stands between the block exploration and its conclusion.  `RunJoin`, the
hypothesis that `MacroGeom.thetaSiteOn_pos_of_runJoin` carries in place of the blockwise joining
hypothesis, is incompatible with a one-step contract better than the trivial one:

`one_le_of_nextBound_of_runJoin`: if admissibility is preserved by examinations, then `RunJoin S G x`
and `S.NextBound rho` together force `1 ≤ rho`, whatever the geometry, the graph and the root.

The proof is the frontier argument of `KN/SiteMacroGeometry.lean`, run at the transcripts a run
reaches rather than at all transcripts, which is precisely the weakening `RunJoin` performs.  A run
declares a block occupied as soon as its event holds (`mem_occupied_runHist_succ`), so at every step
of every run the event of the block examined next implies a connection to the root
(`joined_of_runJoin`).  At the first examination this says that the first block event forces the root
open.  If the root lies outside the first block, that event is decided by a set of sites not
containing the root and is therefore empty (`joined_next_start_eq_empty_of_notMem`).  If the root
lies inside the first block, run the exploration against the all-closed configuration: every
configuration the pinned measure of the resulting transcript sees is closed on the first block, hence
closed at the root, hence not a success (`one_le_of_runJoin_of_mem`).

At `rho = 1` the second hypothesis of `thetaSiteOn_pos_of_runJoin` fails: a Bernoulli word of
parameter `0` records no success (`bernoulliReachProb_zero_reachesSize_one`), so no positive `c`
bounds its reach probability.  The hypotheses of that theorem are contradictory
(`absurd_of_runJoin_of_bernoulli`), and the anchored exploration does not meet them either
(`not_runJoin_anchorSchedule`), although its one-step contract is genuine and its blocks do glue.

What remains is `thetaSiteOn_pos_of_coarsePercolates`.  The geometric half of the renormalisation is
complete, and what it needs from the probabilistic half is not a pinned one-step estimate along an
exploration but a lower bound on the probability of `coarsePercolates`.  That is a percolation statement about the independent coarse field of
`prob_biInter_anchorGood`, whose density `prob_anchorGood_le` caps at `p`.

## Non-vacuity

`sq_le_prob_glue` bounds the probability of an actual gluing event from below by the square of the
block constant, and `anchor_explicit` writes both the contract and that bound out in dimension three
with blocks of radius one at density one half, where the constants are `(1/2) ^ 27` and
`((1/2) ^ 27) ^ 2`.
-/

noncomputable section

namespace KNAll.Site.BlockGlue

open MeasureTheory Set KN Percolation.Literature Percolation.Literature.LatticeModels
open KNAll.Site KNAll.Site.MacroGeom

variable {d : ℕ}

/-! ## Confined connections -/

section ConnTools

variable {V : Type*} {G : SimpleGraph V} {S : Set V} {x y z : V} {ω : SiteConfig V}

theorem mem_inter_of_connWithin (h : ω ∈ connWithin G S x y) : y ∈ ω ∩ S :=
  mem_of_mem_siteCluster G (ω ∩ S) h

theorem connWithin_refl (hx : x ∈ ω ∩ S) : ω ∈ connWithin G S x x :=
  ⟨hx, SimpleGraph.Reachable.refl x⟩

theorem connWithin_trans (h₁ : ω ∈ connWithin G S x y) (h₂ : ω ∈ connWithin G S y z) :
    ω ∈ connWithin G S x z := ⟨h₁.1, h₁.2.trans h₂.2⟩

theorem connWithin_symm (h : ω ∈ connWithin G S x y) : ω ∈ connWithin G S y x :=
  ⟨mem_inter_of_connWithin h, h.2.symm⟩

theorem connWithin_of_adj (hadj : G.Adj x y) (hx : x ∈ ω ∩ S) (hy : y ∈ ω ∩ S) :
    ω ∈ connWithin G S x y :=
  ⟨hx, SimpleGraph.Adj.reachable ((openSiteGraph_adj_iff' G (ω ∩ S) x y).2 ⟨hadj, hx, hy⟩)⟩

theorem mem_siteCluster_of_connWithin (h : ω ∈ connWithin G S x y) :
    y ∈ siteCluster G ω x := connWithin_subset_siteConn G S x y h

theorem siteCluster_symm (h : y ∈ siteCluster G ω x) : x ∈ siteCluster G ω y :=
  ⟨mem_of_mem_siteCluster G ω h, h.2.symm⟩

theorem siteCluster_trans (h₁ : y ∈ siteCluster G ω x) (h₂ : z ∈ siteCluster G ω y) :
    z ∈ siteCluster G ω x := ⟨h₁.1, h₁.2.trans h₂.2⟩

end ConnTools

/-! ## Anchors -/

theorem adj_add_single (x : Site d) (i : Fin d) :
    (zdGraph d).Adj x (x + Pi.single i 1) :=
  (zdGraph_adj_iff x (x + Pi.single i 1)).2 ⟨i, Or.inl rfl⟩

/-- The centre of the face of block `u` in direction `i`, upper side when `b = true`. -/
def anchor (N : ℕ) (u : Site d) (i : Fin d) (b : Bool) : Site d :=
  centre N u + Pi.single i (if b then (N : ℤ) else -(N : ℤ))

theorem single_mem_box (N : ℕ) (i : Fin d) {c : ℤ} (h1 : -(N : ℤ) ≤ c) (h2 : c ≤ N) :
    (Pi.single i c : Site d) ∈ box d N := by
  rw [mem_box]
  intro j
  by_cases hj : j = i
  · subst hj; rw [Pi.single_eq_same]; exact ⟨h1, h2⟩
  · rw [Pi.single_eq_of_ne hj]; omega

theorem centre_add_single_mem_faceBlock (N : ℕ) (u : Site d) (i : Fin d) {c : ℤ}
    (h1 : -(N : ℤ) ≤ c) (h2 : c ≤ N) : centre N u + Pi.single i c ∈ faceBlock N u := by
  have h : Pi.single i c + centre N u ∈ faceBlock N u :=
    Finset.mem_image.2 ⟨Pi.single i c, single_mem_box N i h1 h2, rfl⟩
  rwa [add_comm] at h

theorem centre_mem_faceBlock (N : ℕ) (u : Site d) : centre N u ∈ faceBlock N u := by
  have h : (0 : Site d) + centre N u ∈ faceBlock N u :=
    Finset.mem_image.2 ⟨0, by rw [mem_box]; intro j; simp, rfl⟩
  rwa [zero_add] at h

@[simp] theorem anchor_true (N : ℕ) (u : Site d) (i : Fin d) :
    anchor N u i true = centre N u + Pi.single i (N : ℤ) := rfl

@[simp] theorem anchor_false (N : ℕ) (u : Site d) (i : Fin d) :
    anchor N u i false = centre N u + Pi.single i (-(N : ℤ)) := rfl

theorem anchor_mem_faceBlock (N : ℕ) (u : Site d) (i : Fin d) (b : Bool) :
    anchor N u i b ∈ faceBlock N u := by
  cases b
  · rw [anchor_false]
    exact centre_add_single_mem_faceBlock N u i le_rfl (by omega)
  · rw [anchor_true]
    exact centre_add_single_mem_faceBlock N u i (by omega) le_rfl

/-- The centre of a coarse neighbour, in terms of the centre of the block. -/
theorem centre_add_single (N : ℕ) (u : Site d) (i : Fin d) :
    centre N (u + Pi.single i 1) = centre N u + Pi.single i (2 * (N : ℤ) + 1) := by
  funext j
  by_cases hj : j = i
  · subst hj
    simp only [centre_apply, Pi.add_apply, Pi.single_eq_same]
    ring
  · simp [Pi.single_eq_of_ne hj]

/-- **The two anchors facing each other across the wall between coarse neighbours are lattice
neighbours.**  The blocks tile at spacing `2N+1`, so the upper face centre of block `u` and the
lower face centre of block `u + eᵢ` differ by one step in direction `i`. -/
theorem anchor_adj (N : ℕ) (u : Site d) (i : Fin d) :
    (zdGraph d).Adj (anchor N u i true) (anchor N (u + Pi.single i 1) i false) := by
  have key : anchor N (u + Pi.single i 1) i false = anchor N u i true + Pi.single i 1 := by
    rw [anchor_false, anchor_true, centre_add_single, add_assoc, add_assoc, ← Pi.single_add,
      ← Pi.single_add]
    congr 2
    ring
  rw [key]
  exact adj_add_single _ i

/-! ## The anchored block event -/

/-- **The anchored block event.**  The centre of block `u` is open and joined, by open paths inside
that block, to all `2d` face centres of the block.  The event is decided by the sites of the block
alone, so it is available to a `BlockSchedule` with no loss of freshness. -/
def anchorGood (N : ℕ) (u : Site d) : Set (SiteConfig (Site d)) :=
  {ω : SiteConfig (Site d) | centre N u ∈ ω} ∩
    ⋂ q : Fin d × Bool,
      connWithin (zdGraph d) (↑(faceBlock N u) : Set (Site d)) (centre N u) (anchor N u q.1 q.2)

theorem centre_mem_of_anchorGood {N : ℕ} {u : Site d} {ω : SiteConfig (Site d)}
    (h : ω ∈ anchorGood N u) : centre N u ∈ ω := h.1

theorem connWithin_of_anchorGood {N : ℕ} {u : Site d} {ω : SiteConfig (Site d)}
    (h : ω ∈ anchorGood N u) (i : Fin d) (b : Bool) :
    ω ∈ connWithin (zdGraph d) (↑(faceBlock N u) : Set (Site d)) (centre N u) (anchor N u i b) :=
  Set.mem_iInter.1 h.2 (i, b)

theorem mem_anchorGood {N : ℕ} {u : Site d} {ω : SiteConfig (Site d)} (h0 : centre N u ∈ ω)
    (h : ∀ (i : Fin d) (b : Bool), ω ∈ connWithin (zdGraph d)
      (↑(faceBlock N u) : Set (Site d)) (centre N u) (anchor N u i b)) :
    ω ∈ anchorGood N u :=
  ⟨h0, Set.mem_iInter.2 fun q => h q.1 q.2⟩

theorem determinedBy_anchorGood (N : ℕ) (u : Site d) :
    DeterminedBy (anchorGood N u) (↑(faceBlock N u) : Set (Site d)) :=
  DeterminedBy.inter
    ((determinedBy_mem (centre N u)).mono
      (Set.singleton_subset_iff.2 (Finset.mem_coe.2 (centre_mem_faceBlock N u))))
    (DeterminedBy.iInter fun _ => determinedBy_connWithin _ _ _ _)

theorem measurableSet_anchorGood (N : ℕ) (u : Site d) : MeasurableSet (anchorGood N u) :=
  (determinedBy_anchorGood N u).measurableSet_of_finset

/-! ## Gluing -/

/-- **The gluing lemma.**  Two coarse neighbours that are both anchored-good have their centres
joined by an open path inside the union of the two blocks.  No probability is spent: the two block
events are read on disjoint sets of sites, and the connection between them is forced by the
geometry, because both events name the *same* pair of facing sites. -/
theorem connWithin_union_of_anchorGood (N : ℕ) (u : Site d) (i : Fin d)
    {ω : SiteConfig (Site d)} (h : ω ∈ anchorGood N u)
    (h' : ω ∈ anchorGood N (u + Pi.single i 1)) :
    ω ∈ connWithin (zdGraph d)
      ((↑(faceBlock N u) : Set (Site d)) ∪ ↑(faceBlock N (u + Pi.single i 1)))
      (centre N u) (centre N (u + Pi.single i 1)) := by
  have h1 := connWithin_mono_set (zdGraph d) (S' := (↑(faceBlock N u) : Set (Site d)) ∪
      ↑(faceBlock N (u + Pi.single i 1))) Set.subset_union_left _ _
    (connWithin_of_anchorGood h i true)
  have h2 := connWithin_mono_set (zdGraph d) (S' := (↑(faceBlock N u) : Set (Site d)) ∪
      ↑(faceBlock N (u + Pi.single i 1))) Set.subset_union_right _ _
    (connWithin_of_anchorGood h' i false)
  exact connWithin_trans
    (connWithin_trans h1
      (connWithin_of_adj (anchor_adj N u i) (mem_inter_of_connWithin h1)
        (mem_inter_of_connWithin h2)))
    (connWithin_symm h2)

/-- **The gluing lemma, in the ambient lattice.**  The centres of two coarse-adjacent anchored-good
blocks lie in one open cluster. -/
theorem siteCluster_centre_of_coarse_adj (N : ℕ) {u u' : Site d} (hadj : (zdGraph d).Adj u u')
    {ω : SiteConfig (Site d)} (h : ω ∈ anchorGood N u) (h' : ω ∈ anchorGood N u') :
    centre N u' ∈ siteCluster (zdGraph d) ω (centre N u) := by
  obtain ⟨i, hi | hi⟩ := (zdGraph_adj_iff u u').1 hadj
  · subst hi
    exact mem_siteCluster_of_connWithin (connWithin_union_of_anchorGood N u i h h')
  · subst hi
    exact siteCluster_symm
      (mem_siteCluster_of_connWithin (connWithin_union_of_anchorGood N u' i h' h))

/-- **A coarse path of anchored-good blocks is one open cluster.** -/
theorem siteCluster_centre_of_coarse_walk (N : ℕ) (v : ℕ → Site d)
    (hadj : ∀ k, (zdGraph d).Adj (v k) (v (k + 1))) {ω : SiteConfig (Site d)}
    (hgood : ∀ k, ω ∈ anchorGood N (v k)) (n : ℕ) :
    centre N (v n) ∈ siteCluster (zdGraph d) ω (centre N (v 0)) := by
  induction n with
  | zero => exact mem_siteCluster_self _ _ (centre_mem_of_anchorGood (hgood 0))
  | succ n ih =>
    exact siteCluster_trans ih
      (siteCluster_centre_of_coarse_adj N (hadj n) (hgood n) (hgood (n + 1)))

theorem centre_injective (N : ℕ) : Function.Injective (centre (d := d) N) := by
  intro u u' h
  funext i
  have hi := congrFun h i
  simp only [centre_apply] at hi
  exact mul_left_cancel₀ (by omega : (2 * (N : ℤ) + 1) ≠ 0) hi

/-- **An infinite coarse path of anchored-good blocks gives an infinite open cluster.**  This is
what the renormalisation asks gluing for, and it is here proved outright: the coarse geometry alone
converts coarse connectivity into a single infinite cluster of the lattice. -/
theorem infinite_siteCluster_of_coarse_walk (N : ℕ) (v : ℕ → Site d) (hv : Function.Injective v)
    (hadj : ∀ k, (zdGraph d).Adj (v k) (v (k + 1))) {ω : SiteConfig (Site d)}
    (hgood : ∀ k, ω ∈ anchorGood N (v k)) :
    (siteCluster (zdGraph d) ω (centre N (v 0))).Infinite :=
  Set.infinite_of_injective_forall_mem (f := fun n : ℕ => centre N (v n))
    ((centre_injective N).comp hv) (siteCluster_centre_of_coarse_walk N v hadj hgood)

/-- The coarse ray in direction `i`. -/
def coarseRay (i : Fin d) (k : ℕ) : Site d := Pi.single i (k : ℤ)

theorem coarseRay_injective (i : Fin d) : Function.Injective (coarseRay (d := d) i) := by
  intro k l h
  have hi := congrFun h i
  simp only [coarseRay, Pi.single_eq_same] at hi
  exact_mod_cast hi

theorem coarseRay_adj (i : Fin d) (k : ℕ) :
    (zdGraph d).Adj (coarseRay i k) (coarseRay i (k + 1)) := by
  have h : coarseRay (d := d) i (k + 1) = coarseRay i k + Pi.single i 1 := by
    rw [coarseRay, coarseRay, ← Pi.single_add]
    push_cast
    ring_nf
  rw [h]
  exact adj_add_single _ i

/-! ## The probability of the anchored event -/

/-- The straight column of sites from the centre of a block towards the upper face centre lies in
the block, so an all-open block joins the centre to it. -/
theorem connWithin_column_pos (N : ℕ) (u : Site d) (i : Fin d) {ω : SiteConfig (Site d)}
    (hopen : (↑(faceBlock N u) : Set (Site d)) ⊆ ω) :
    ∀ t : ℕ, t ≤ N →
      ω ∈ connWithin (zdGraph d) (↑(faceBlock N u) : Set (Site d)) (centre N u)
        (centre N u + Pi.single i (t : ℤ)) := by
  have hmem : ∀ c : ℤ, -(N : ℤ) ≤ c → c ≤ N →
      centre N u + Pi.single i c ∈ ω ∩ (↑(faceBlock N u) : Set (Site d)) := by
    intro c h1 h2
    have hb : centre N u + Pi.single i c ∈ (↑(faceBlock N u) : Set (Site d)) :=
      Finset.mem_coe.2 (centre_add_single_mem_faceBlock N u i h1 h2)
    exact ⟨hopen hb, hb⟩
  intro t
  induction t with
  | zero =>
    intro _
    rw [Nat.cast_zero, Pi.single_zero, add_zero]
    exact connWithin_refl (by simpa using hmem 0 (by omega) (by omega))
  | succ t ih =>
    intro ht
    have hEq : centre N u + Pi.single i ((t + 1 : ℕ) : ℤ)
        = (centre N u + Pi.single i (t : ℤ)) + Pi.single i 1 := by
      rw [add_assoc, ← Pi.single_add]
      push_cast
      ring_nf
    rw [hEq]
    refine connWithin_trans (ih (by omega))
      (connWithin_of_adj (adj_add_single _ i) (hmem _ (by omega) (by omega)) ?_)
    have := hmem ((t + 1 : ℕ) : ℤ) (by omega) (by omega)
    rwa [hEq] at this

/-- The same for the lower face centre. -/
theorem connWithin_column_neg (N : ℕ) (u : Site d) (i : Fin d) {ω : SiteConfig (Site d)}
    (hopen : (↑(faceBlock N u) : Set (Site d)) ⊆ ω) :
    ∀ t : ℕ, t ≤ N →
      ω ∈ connWithin (zdGraph d) (↑(faceBlock N u) : Set (Site d)) (centre N u)
        (centre N u + Pi.single i (-(t : ℤ))) := by
  have hmem : ∀ c : ℤ, -(N : ℤ) ≤ c → c ≤ N →
      centre N u + Pi.single i c ∈ ω ∩ (↑(faceBlock N u) : Set (Site d)) := by
    intro c h1 h2
    have hb : centre N u + Pi.single i c ∈ (↑(faceBlock N u) : Set (Site d)) :=
      Finset.mem_coe.2 (centre_add_single_mem_faceBlock N u i h1 h2)
    exact ⟨hopen hb, hb⟩
  intro t
  induction t with
  | zero =>
    intro _
    rw [Nat.cast_zero, neg_zero, Pi.single_zero, add_zero]
    exact connWithin_refl (by simpa using hmem 0 (by omega) (by omega))
  | succ t ih =>
    intro ht
    have hEq : centre N u + Pi.single i (-(t : ℤ))
        = (centre N u + Pi.single i (-((t + 1 : ℕ) : ℤ))) + Pi.single i 1 := by
      rw [add_assoc, ← Pi.single_add]
      push_cast
      ring_nf
    refine connWithin_trans (ih (by omega)) ?_
    rw [hEq]
    refine connWithin_symm (connWithin_of_adj (adj_add_single _ i)
      (hmem _ (by omega) (by omega)) ?_)
    rw [← hEq]
    exact hmem _ (by omega) (by omega)

/-- **An all-open block is anchored-good.**  This is what makes the anchored event non-vacuous, and
it is what gives the explicit lower bound on its probability below. -/
theorem allOpen_subset_anchorGood (N : ℕ) (u : Site d) :
    allOpen (faceBlock N u) ⊆ anchorGood N u := by
  intro ω hω
  refine mem_anchorGood (hω (Finset.mem_coe.2 (centre_mem_faceBlock N u))) fun i b => ?_
  cases b
  · rw [anchor_false]
    exact connWithin_column_neg N u i hω N le_rfl
  · rw [anchor_true]
    exact connWithin_column_pos N u i hω N le_rfl

/-- **The anchored event has probability at least `p ^ (2N+1)^d`**, uniformly in the coarse index:
no translation invariance is needed, because the bound is read off the all-open configuration of the
block itself. -/
theorem pow_le_prob_anchorGood (N : ℕ) (u : Site d) (p : unitInterval) :
    (p : ℝ) ^ ((2 * N + 1) ^ d) ≤ (siteBernoulli fun _ : Site d => p).real (anchorGood N u) := by
  have h := measureReal_mono (μ := siteBernoulli fun _ : Site d => p)
    (allOpen_subset_anchorGood N u) (measure_ne_top _ _)
  rwa [prob_allOpen, faceBlock_card] at h

/-- **The cost of anchoring, exactly.**  The anchored event forces a named site to be open, so its
probability is at most the density.  It cannot be pushed towards `1`, and the section
`The one-step contract is capped by the density` below shows that nothing else could have been:
`RunJoin` caps every block event of the framework at `p` as well. -/
theorem prob_anchorGood_le (N : ℕ) (u : Site d) (p : unitInterval) :
    (siteBernoulli fun _ : Site d => p).real (anchorGood N u) ≤ (p : ℝ) :=
  calc (siteBernoulli fun _ : Site d => p).real (anchorGood N u)
      ≤ (siteBernoulli fun _ : Site d => p).real
          {ω : SiteConfig (Site d) | centre N u ∈ ω} :=
        measureReal_mono (fun _ h => h.1) (measure_ne_top _ _)
    _ = (p : ℝ) := prodBernoulli_real_setOf_mem _ _

/-! ## The anchored block schedule -/

/-- **The anchored schedule.**  Boxes of radius `N` at the coarse points `u k`, spaced `2N+1` apart,
each carrying the anchored event of that block.  Every field is the one of
`MacroGeom.faceSchedule`; only the block event has changed. -/
def anchorSchedule (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u) (p : unitInterval) :
    BlockSchedule d where
  blk k := faceBlock N (u k)
  size := (2 * N + 1) ^ d
  size_pos := pow_pos (by omega) d
  blk_card k := faceBlock_card N (u k)
  blk_disjoint k l hkl := faceBlock_disjoint N fun hEq => hkl (hu hEq)
  good k := anchorGood N (u k)
  good_det k := determinedBy_anchorGood N (u k)
  good_meas k := measurableSet_anchorGood N (u k)
  param := p

@[simp] theorem anchorSchedule_good (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u)
    (p : unitInterval) (k : ℕ) : (anchorSchedule d N u hu p).good k = anchorGood N (u k) := rfl

@[simp] theorem anchorSchedule_blk (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u)
    (p : unitInterval) (k : ℕ) : (anchorSchedule d N u hu p).blk k = faceBlock N (u k) := rfl

/-- **Freshness survives.**  The anchored event is decided by the block's own sites, so the one-step
contract of `BlockSchedule.walk_nextBound` applies verbatim, with the explicit constant
`p ^ (2N+1)^d`. -/
theorem anchorSchedule_nextBound (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u)
    (p : unitInterval) :
    (anchorSchedule d N u hu p).walk.NextBound (1 - (p : ℝ) ^ ((2 * N + 1) ^ d)) :=
  (anchorSchedule d N u hu p).walk_nextBound (c := (p : ℝ) ^ ((2 * N + 1) ^ d))
    fun k => pow_le_prob_anchorGood N (u k) p

/-- **Independence survives.**  The anchored events of distinct blocks are decided by disjoint sets
of sites, so a finite conjunction of them has probability the product. -/
theorem prob_biInter_anchorGood (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u)
    (p : unitInterval) (F : Finset ℕ) :
    (siteBernoulli fun _ : Site d => p).real (⋂ k ∈ F, anchorGood N (u k))
      = ∏ k ∈ F, (siteBernoulli fun _ : Site d => p).real (anchorGood N (u k)) :=
  (anchorSchedule d N u hu p).prob_biInter_good F

/-- **The whole package at once.**  For a finite set of coarse indices the probability that every
one of the corresponding blocks is anchored-good is at least `(p ^ (2N+1)^d) ^ #F`. -/
theorem pow_le_prob_biInter_anchorGood (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u)
    (p : unitInterval) (F : Finset ℕ) :
    ((p : ℝ) ^ ((2 * N + 1) ^ d)) ^ F.card
      ≤ (siteBernoulli fun _ : Site d => p).real (⋂ k ∈ F, anchorGood N (u k)) :=
  (anchorSchedule d N u hu p).pow_le_prob_biInter_good
    (pow_nonneg (unitInterval.nonneg p) _) (fun k => pow_le_prob_anchorGood N (u k) p) F

/-! ## What a run knows -/

section Runs

variable {S : SiteWalk d} {G : SimpleGraph (Site d)} {x : Site d}

/-- `SiteWalk.runHist_succ` peels off the *first* examination; this peels off the last one. -/
theorem runHist_succ' (S : SiteWalk d) (n : ℕ) :
    ∀ (h : MacroHistory d S.Index) (ω : SiteConfig (Site d)),
      S.runHist (n + 1) h ω = S.step (S.runHist n h ω) (S.bit (S.runHist n h ω) ω) ω := by
  induction n with
  | zero => intro h ω; rw [S.runHist_succ, S.runHist_zero, S.runHist_zero]
  | succ n ih =>
    intro h ω
    rw [S.runHist_succ, ih, S.runHist_succ]

/-- **A success at step `n` puts the examined block into the occupied set.** -/
theorem mem_occupied_runHist_succ (S : SiteWalk d) (n : ℕ) (h : MacroHistory d S.Index)
    (ω : SiteConfig (Site d)) (hω : ω ∈ S.joined (S.next (S.runHist n h ω))) :
    S.next (S.runHist n h ω) ∈ (S.runHist (n + 1) h ω).occupied := by
  rw [runHist_succ' S n h ω, S.bit_of_mem hω, S.step_occupied_true]
  exact Finset.mem_insert_self _ _

/-- **`RunJoin` is the blockwise joining hypothesis, at every transcript a run reaches.**  The
weakening of `SiteWalk.thetaSiteOn_pos`'s hypothesis to `RunJoin` therefore buys nothing at the
frontier: at each step of each run, the block about to be examined must certify a connection to the
root as soon as its event holds. -/
theorem joined_of_runJoin (hrun : RunJoin S G x) (n : ℕ) (ω : SiteConfig (Site d))
    (hω : ω ∈ S.joined (S.next (S.runHist n S.start ω))) :
    ∃ y ∈ (↑(S.block (S.next (S.runHist n S.start ω))) : Set (Site d)), y ∈ siteCluster G ω x :=
  hrun (n + 1) ω _ (mem_occupied_runHist_succ S n S.start ω hω)

/-- **The event of the first block examined forces the root open.** -/
theorem joined_next_start_subset (hrun : RunJoin S G x) :
    S.joined (S.next S.start) ⊆ {ω : SiteConfig (Site d) | x ∈ ω} := by
  intro ω hω
  obtain ⟨y, -, hy⟩ := joined_of_runJoin hrun 0 ω hω
  exact hy.1

/-- **No walk satisfying `RunJoin` can call the all-closed configuration a success at its first
examination.** -/
theorem allClosed_notMem_joined_next_start (hrun : RunJoin S G x) :
    (∅ : SiteConfig (Site d)) ∉ S.joined (S.next S.start) := fun h =>
  Set.notMem_empty x (joined_next_start_subset hrun h)

/-- **The one-step contract of a `RunJoin` walk is capped by the density.**  Whatever the geometry,
the block examined first is good with probability at most `p`. -/
theorem one_sub_rho_le_param_of_runJoin (hrun : RunJoin S G x) {rho : ℝ} (hS : S.NextBound rho)
    {p : unitInterval} (hden : S.density = fun _ => p) : 1 - rho ≤ (p : ℝ) := by
  have hstart := hS S.start S.start_admissible
  have hmono : S.start.prob S.density (S.joined (S.next S.start))
      ≤ S.start.prob S.density {ω : SiteConfig (Site d) | x ∈ ω} := by
    rw [MacroHistory.prob_eq, MacroHistory.prob_eq, pinnedProb, pinnedProb]
    exact measureReal_mono (Set.preimage_mono (joined_next_start_subset hrun))
      (measure_ne_top _ _)
  have hval : S.start.prob S.density {ω : SiteConfig (Site d) | x ∈ ω} = (p : ℝ) := by
    rw [MacroHistory.prob_eq, S.start_inspected, Finset.coe_empty, pinnedProb_empty, hden,
      prodBernoulli_real_setOf_mem]
  linarith [hval ▸ hmono]

end Runs

/-! ## Reading a block event on sites already inspected -/

section Overlap

/-- **An event that needs an open site among those already read has pinned probability zero.**
The pinned measure prescribes the recorded states, and the record says every site of `R` is
closed. -/
theorem prob_eq_zero_of_needs_open {M : Type*} (h : MacroHistory d M) (p : Site d → unitInterval)
    {R : Finset (Site d)} (hR : R ⊆ h.inspected) (hclosed : ∀ z ∈ R, z ∉ h.openSites)
    {A : Set (SiteConfig (Site d))} (hA : A ⊆ {ω : SiteConfig (Site d) | ∃ z ∈ R, z ∈ ω}) :
    h.prob p A = 0 := by
  have hempty : substitute (↑h.inspected : Set (Site d)) h.state ⁻¹' A = ∅ := by
    ext ω
    simp only [Set.mem_preimage, Set.mem_empty_iff_false, iff_false]
    intro hmem
    obtain ⟨z, hzR, hz⟩ := hA hmem
    rw [mem_substitute_of_mem _ (Finset.mem_coe.2 (hR hzR))] at hz
    exact hclosed z hzR hz
  rw [MacroHistory.prob_eq, pinnedProb, hempty, measureReal_empty]

/-- **Overlapping regions destroy the one-step contract.**  If the block event examined next needs
an open site inside a region already inspected and recorded closed, then no `rho < 1` satisfies the
contract at that transcript.  This is what reading block events on overlapping regions costs inside
this framework: not the independence of the block field, but the one-step estimate itself. -/
theorem one_le_of_nextBound_of_needs_open (S : SiteWalk d) {rho : ℝ} (hS : S.NextBound rho)
    {h : MacroHistory d S.Index} (hadm : S.Admissible h) {R : Finset (Site d)}
    (hR : R ⊆ h.inspected) (hclosed : ∀ z ∈ R, z ∉ h.openSites)
    (hA : S.joined (S.next h) ⊆ {ω : SiteConfig (Site d) | ∃ z ∈ R, z ∈ ω}) : 1 ≤ rho := by
  have h0 := hS h hadm
  rw [prob_eq_zero_of_needs_open h S.density hR hclosed hA] at h0
  linarith

/-- **And the transcript that kills it is produced by the exploration itself**, by running it
against the all-closed configuration. -/
theorem one_le_of_nextBound_of_run_needs_open (S : SiteWalk d)
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω))
    {rho : ℝ} (hS : S.NextBound rho) (n : ℕ) {R : Finset (Site d)}
    (hR : R ⊆ (S.runHist n S.start (∅ : SiteConfig (Site d))).inspected)
    (hA : S.joined (S.next (S.runHist n S.start (∅ : SiteConfig (Site d))))
      ⊆ {ω : SiteConfig (Site d) | ∃ z ∈ R, z ∈ ω}) : 1 ≤ rho := by
  refine one_le_of_nextBound_of_needs_open S hS
    (admissible_runHist S hadm n S.start (∅ : SiteConfig (Site d)) S.start_admissible) hR ?_ hA
  intro z _
  rw [runHist_openSites_of_empty S n S.start (start_openSites S)]
  exact Finset.notMem_empty z

end Overlap

/-! ## The frontier obstruction survives the weakening to `RunJoin` -/

section NoRunJoin

variable {S : SiteWalk d} {G : SimpleGraph (Site d)} {x : Site d}

/-- The event of the first block examined is decided by that block. -/
theorem determinedBy_joined_next_start (S : SiteWalk d) :
    DeterminedBy (S.joined (S.next S.start)) (↑(S.block (S.next S.start)) : Set (Site d)) := by
  have h := S.joined_determinedBy S.start S.start_admissible
  rwa [S.start_inspected, Finset.coe_empty, Set.empty_union] at h

/-- **The root outside the first block empties that block's event.**  The event forces the root
open and is decided by a set of sites not containing it, so it is decided both ways. -/
theorem joined_next_start_eq_empty_of_notMem (hrun : RunJoin S G x)
    (hx : x ∉ S.block (S.next S.start)) : S.joined (S.next S.start) = ∅ := by
  ext ω
  simp only [Set.mem_empty_iff_false, iff_false]
  intro hω
  have hagree : ω ∩ (↑(S.block (S.next S.start)) : Set (Site d))
      = (ω \ {x}) ∩ (↑(S.block (S.next S.start)) : Set (Site d)) := by
    ext z
    simp only [Set.mem_inter_iff, Set.mem_sdiff, Set.mem_singleton_iff]
    constructor
    · rintro ⟨hz, hzb⟩
      refine ⟨⟨hz, ?_⟩, hzb⟩
      rintro rfl
      exact hx (Finset.mem_coe.1 hzb)
    · rintro ⟨⟨hz, -⟩, hzb⟩
      exact ⟨hz, hzb⟩
  have hmem' : ω \ {x} ∈ S.joined (S.next S.start) :=
    ((determinedBy_iff _ _).1 (determinedBy_joined_next_start S) ω (ω \ {x}) hagree).1 hω
  exact (joined_next_start_subset hrun hmem').2 rfl

/-- **The root inside the first block kills the contract at the second examination.**  Run against
the all-closed configuration.  Every configuration the pinned measure of the resulting transcript
sees is closed on the first block, hence closed at the root, hence cannot be a success. -/
theorem one_le_of_runJoin_of_mem (hrun : RunJoin S G x)
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω))
    (hx : x ∈ S.block (S.next S.start)) {rho : ℝ} (hS : S.NextBound rho) : 1 ≤ rho := by
  classical
  have hdef : S.runHist 1 S.start (∅ : SiteConfig (Site d))
      = S.step S.start (S.bit S.start (∅ : SiteConfig (Site d))) (∅ : SiteConfig (Site d)) := by
    rw [S.runHist_succ, S.runHist_zero]
  have hins : S.block (S.next S.start)
      ⊆ (S.runHist 1 S.start (∅ : SiteConfig (Site d))).inspected := by
    rw [hdef]
    simp only [SiteWalk.step_inspected]
    exact Finset.subset_union_right
  have hsame : ∀ ω : SiteConfig (Site d), (∀ z ∈ S.block (S.next S.start), z ∉ ω) →
      S.runHist 1 S.start ω = S.runHist 1 S.start (∅ : SiteConfig (Site d)) := by
    intro ω hω
    have hinter : ω ∩ (↑(S.block (S.next S.start)) : Set (Site d))
        = (∅ : SiteConfig (Site d)) ∩ (↑(S.block (S.next S.start)) : Set (Site d)) := by
      ext z
      simp only [Set.mem_inter_iff, Set.mem_empty_iff_false, false_and, iff_false]
      rintro ⟨hz, hzb⟩
      exact hω z (Finset.mem_coe.1 hzb) hz
    have hiff := (determinedBy_iff _ _).1 (determinedBy_joined_next_start S) ω
      (∅ : SiteConfig (Site d)) hinter
    have hbit : S.bit S.start ω = S.bit S.start (∅ : SiteConfig (Site d)) := by
      by_cases hmem : ω ∈ S.joined (S.next S.start)
      · rw [S.bit_of_mem hmem, S.bit_of_mem (hiff.1 hmem)]
      · rw [S.bit_of_notMem hmem, S.bit_of_notMem fun hc => hmem (hiff.2 hc)]
    rw [S.runHist_succ, S.runHist_succ, S.runHist_zero, S.runHist_zero, hbit,
      S.step_congr S.start _ (fun z hz => ?_)]
    exact ⟨fun hzω => absurd hzω (hω z hz), fun hzc => absurd hzc (Set.notMem_empty z)⟩
  have hfail : ∀ ω : SiteConfig (Site d), (∀ z ∈ S.block (S.next S.start), z ∉ ω) →
      ω ∉ S.joined (S.next (S.runHist 1 S.start (∅ : SiteConfig (Site d)))) := by
    intro ω hω hmem
    rw [← hsame ω hω] at hmem
    obtain ⟨y, -, hy⟩ := joined_of_runJoin hrun 1 ω hmem
    exact hω x hx hy.1
  have hzero : (S.runHist 1 S.start (∅ : SiteConfig (Site d))).prob S.density
      (S.joined (S.next (S.runHist 1 S.start (∅ : SiteConfig (Site d))))) = 0 := by
    rw [MacroHistory.prob_eq, pinnedProb]
    have hpre : substitute
        (↑(S.runHist 1 S.start (∅ : SiteConfig (Site d))).inspected : Set (Site d))
        (S.runHist 1 S.start (∅ : SiteConfig (Site d))).state ⁻¹'
        S.joined (S.next (S.runHist 1 S.start (∅ : SiteConfig (Site d)))) = ∅ := by
      ext ω
      simp only [Set.mem_preimage, Set.mem_empty_iff_false, iff_false]
      intro hmem
      refine hfail _ (fun z hz hzmem => ?_) hmem
      rw [mem_substitute_of_mem _ (Finset.mem_coe.2 (hins hz))] at hzmem
      have hz' : z ∈ (S.runHist 1 S.start (∅ : SiteConfig (Site d))).openSites := hzmem
      rw [runHist_openSites_of_empty S 1 S.start (start_openSites S)] at hz'
      exact Finset.notMem_empty z hz'
    rw [hpre, measureReal_empty]
  have hb := hS (S.runHist 1 S.start (∅ : SiteConfig (Site d)))
    (admissible_runHist S hadm 1 S.start (∅ : SiteConfig (Site d)) S.start_admissible)
  rw [hzero] at hb
  linarith

/-- **The frontier obstruction, in full.**  No exploration whose admissibility is preserved by
examinations can satisfy `RunJoin` together with a one-step contract better than the trivial one.
Gluing is therefore not what stands between the block exploration and its conclusion: even with the
gluing of the previous sections in hand, `RunJoin` and `NextBound rho` with `rho < 1` are
incompatible, whatever the geometry, the graph and the root. -/
theorem one_le_of_nextBound_of_runJoin (hrun : RunJoin S G x)
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω))
    {rho : ℝ} (hS : S.NextBound rho) : 1 ≤ rho := by
  by_cases hx : x ∈ S.block (S.next S.start)
  · exact one_le_of_runJoin_of_mem hrun hadm hx hS
  · have hb := hS S.start S.start_admissible
    rw [MacroHistory.prob_eq, joined_next_start_eq_empty_of_notMem hrun hx,
      pinnedProb_emptyEvent] at hb
    linarith

end NoRunJoin

/-! ## The contract cannot be traded for the word estimate -/

section Degenerate

theorem numJoined_append_false : ∀ w : List Bool, numJoined (w ++ [false]) = numJoined w := by
  intro w
  induction w with
  | nil => rfl
  | cons a w ih => cases a <;> simp only [List.cons_append, numJoined, ih]

/-- **A Bernoulli word of parameter zero never records a success.** -/
theorem walkProb_zero_of_numJoined_lt (k : ℕ) : ∀ (n : ℕ) (w : List Bool), numJoined w < k →
    walkProb (fun _ => (0 : ℝ)) (reachesSize k) n w = 0 := by
  intro n
  induction n with
  | zero =>
    intro w hw
    have hnot : ¬ reachesSize k w := by simp only [reachesSize]; omega
    rw [walkProb_zero, if_neg hnot]
  | succ n ih =>
    intro w hw
    rw [walkProb_succ, ih (w ++ [false]) (by rw [numJoined_append_false]; exact hw)]
    simp

theorem bernoulliReachProb_zero_reachesSize_one (n : ℕ) :
    bernoulliReachProb 0 (reachesSize 1) n = 0 :=
  walkProb_zero_of_numJoined_lt 1 n [] Nat.zero_lt_one

/-- **The hypotheses of `MacroGeom.thetaSiteOn_pos_of_runJoin` are contradictory.**  `RunJoin` forces
`rho = 1`, and at `rho = 1` the Bernoulli word estimate the theorem also asks for is false: a
Bernoulli(0) word records no success, so no positive `c` bounds its reach probability.  The
conclusion of that theorem is therefore never obtained through it, whatever the geometry supplies. -/
theorem absurd_of_runJoin_of_bernoulli {S : SiteWalk d} {G : SimpleGraph (Site d)} {x : Site d}
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω))
    (hrun : RunJoin S G x) {rho c : ℝ} (hrho1 : rho ≤ 1) (hS : S.NextBound rho) (hc : 0 < c)
    (steps : ℕ → ℕ)
    (hbern : ∀ k : ℕ, c ≤ bernoulliReachProb (1 - rho) (reachesSize k) (steps k)) : False := by
  have hrho : rho = 1 := le_antisymm hrho1 (one_le_of_nextBound_of_runJoin hrun hadm hS)
  have hb := hbern 1
  rw [hrho, sub_self, bernoulliReachProb_zero_reachesSize_one] at hb
  linarith

/-- **The anchored exploration does not satisfy `RunJoin` either.**  Its one-step contract is
genuine, with the explicit constant `p ^ (2N+1)^d`, so the previous theorem applies to it: gluing
the blocks does not make the fixed-order exploration join them to a fixed root. -/
theorem not_runJoin_anchorSchedule (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u)
    (p : unitInterval) (hp : 0 < (p : ℝ)) (G : SimpleGraph (Site d)) (x : Site d) :
    ¬ RunJoin (anchorSchedule d N u hu p).walk G x := by
  intro hrun
  have h := one_le_of_nextBound_of_runJoin hrun
    (fun h b ω hh => BlockSchedule.walk_step_admissible _ h b ω hh)
    (anchorSchedule_nextBound d N u hu p)
  have hpos : (0 : ℝ) < (p : ℝ) ^ ((2 * N + 1) ^ d) := pow_pos hp _
  linarith

end Degenerate

/-! ## What coalescence supplies, and what it cannot -/

section Coalescence

/-- **The coalescence input, as a single event of the region it speaks about.**  No pair of sites of
the inner box has two arms to the sphere of radius `M` inside `box d N` while remaining unjoined
inside `box d N`. -/
def coalesceAll (d m M N : ℕ) : Set (SiteConfig (Site d)) :=
  (⋃ x ∈ box d m, ⋃ y ∈ box d m, localCoalescenceEvent d M N x y)ᶜ

theorem determinedBy_coalesceAll (d m M N : ℕ) :
    DeterminedBy (coalesceAll d m M N) (↑(box d N) : Set (Site d)) :=
  (DeterminedBy.iUnion fun x => DeterminedBy.iUnion fun _ => DeterminedBy.iUnion fun y =>
    DeterminedBy.iUnion fun _ => determinedBy_localCoalescenceEvent d M N x y).compl

theorem measurableSet_coalesceAll (d m M N : ℕ) : MeasurableSet (coalesceAll d m M N) :=
  (determinedBy_coalesceAll d m M N).measurableSet_of_finset

/-- **Coalescence, in the form a gluing argument would use it:** two arms inside the region are two
arms of one cluster. -/
theorem connWithin_of_coalesceAll {d m M N : ℕ} {ω : SiteConfig (Site d)}
    (hω : ω ∈ coalesceAll d m M N) {x y : Site d} (hx : x ∈ box d m) (hy : y ∈ box d m)
    (hax : ω ∈ connWithinSet (zdGraph d) (↑(box d N) : Set (Site d)) x (boxSphere d M))
    (hay : ω ∈ connWithinSet (zdGraph d) (↑(box d N) : Set (Site d)) y (boxSphere d M)) :
    ω ∈ connWithin (zdGraph d) (↑(box d N) : Set (Site d)) x y := by
  by_contra hcon
  exact hω (Set.mem_iUnion₂.2 ⟨x, hx, Set.mem_iUnion₂.2 ⟨y, hy, ⟨⟨hax, hay⟩, hcon⟩⟩⟩)

/-- **The union bound over the pairs.**  The coalescence input is stated pair by pair; the region
event costs a factor of the number of pairs, which is fixed before the error is chosen. -/
theorem prob_coalesceAll_ge (d m M N : ℕ) (p : unitInterval) {η : ℝ}
    (hb : ∀ x ∈ box d m, ∀ y ∈ box d m,
      (siteBernoulli fun _ : Site d => p).real (localCoalescenceEvent d M N x y) ≤ η) :
    1 - (((2 * m + 1) ^ d : ℕ) : ℝ) * ((((2 * m + 1) ^ d : ℕ) : ℝ) * η)
      ≤ (siteBernoulli fun _ : Site d => p).real (coalesceAll d m M N) := by
  classical
  have hmeas : MeasurableSet
      (⋃ x ∈ box d m, ⋃ y ∈ box d m, localCoalescenceEvent d M N x y) :=
    Finset.measurableSet_biUnion _ fun x _ => Finset.measurableSet_biUnion _ fun y _ =>
      measurableSet_localCoalescenceEvent d M N x y
  have hU : (siteBernoulli fun _ : Site d => p).real
      (⋃ x ∈ box d m, ⋃ y ∈ box d m, localCoalescenceEvent d M N x y)
      ≤ (((2 * m + 1) ^ d : ℕ) : ℝ) * ((((2 * m + 1) ^ d : ℕ) : ℝ) * η) := by
    refine (measureReal_biUnion_finset_le _ _).trans ?_
    have hstep : ∀ x ∈ box d m, (siteBernoulli fun _ : Site d => p).real
        (⋃ y ∈ box d m, localCoalescenceEvent d M N x y)
        ≤ (((2 * m + 1) ^ d : ℕ) : ℝ) * η := by
      intro x hx
      refine (measureReal_biUnion_finset_le _ _).trans ?_
      refine (Finset.sum_le_sum fun y hy => hb x hx y hy).trans ?_
      rw [Finset.sum_const, card_box, nsmul_eq_mul]
    refine (Finset.sum_le_sum hstep).trans ?_
    rw [Finset.sum_const, card_box, nsmul_eq_mul]
  rw [coalesceAll, measureReal_compl hmeas, probReal_univ]
  linarith

/-- **Coalescence is available fresh, local and close to one**, read off the intrinsic inputs that
`KNAll.Site.siteIntrinsicInputs_of_thetaSite_pos` produces from supercriticality alone. -/
theorem exists_coalesceAll_prob_ge (d : ℕ) (p : unitInterval) (H : SiteIntrinsicInputs d p)
    (m : ℕ) (ε : ℝ) (hε : 0 < ε) :
    ∃ M > m, ∃ N ≥ M, 1 - ε ≤ (siteBernoulli fun _ : Site d => p).real (coalesceAll d m M N) := by
  have hc : (0 : ℝ) < (((2 * m + 1) ^ d : ℕ) : ℝ) :=
    Nat.cast_pos.2 (pow_pos (by omega) d)
  obtain ⟨M, hMm, N, hNM, hb⟩ := H.coalescence m
    (ε / ((((2 * m + 1) ^ d : ℕ) : ℝ) * (((2 * m + 1) ^ d : ℕ) : ℝ))) (by positivity)
  refine ⟨M, hMm, N, hNM, ?_⟩
  refine le_trans (le_of_eq ?_) (prob_coalesceAll_ge d m M N p hb)
  field_simp

/-- **The coalescence event carries no connection.**  The all-closed configuration satisfies it: it
asserts the *absence* of a bad pair, and there is no pair at all when nothing is open. -/
theorem allClosed_notMem_localCoalescenceEvent (d M N : ℕ) (x y : Site d) :
    (∅ : SiteConfig (Site d)) ∉ localCoalescenceEvent d M N x y := by
  rintro ⟨⟨harm, -⟩, -⟩
  obtain ⟨a, -, hconn⟩ := (mem_connWithinSet_iff _ _ _ _ _).1 harm
  exact Set.notMem_empty x hconn.1.1

theorem allClosed_mem_coalesceAll (d m M N : ℕ) :
    (∅ : SiteConfig (Site d)) ∈ coalesceAll d m M N := by
  intro hmem
  obtain ⟨x, -, hmem'⟩ := Set.mem_iUnion₂.1 hmem
  obtain ⟨y, -, hmem''⟩ := Set.mem_iUnion₂.1 hmem'
  exact allClosed_notMem_localCoalescenceEvent d M N x y hmem''

/-- **So coalescence cannot be a block event of an exploration meeting `RunJoin`.**  A block whose
event holds in the all-closed configuration is declared occupied there, and in that configuration no
site is joined to anything. -/
theorem not_runJoin_of_joined_next_start_eq_coalesceAll {S : SiteWalk d}
    {G : SimpleGraph (Site d)} {x : Site d} (m M N : ℕ)
    (h : S.joined (S.next S.start) = coalesceAll d m M N) : ¬ RunJoin S G x := fun hrun =>
  allClosed_notMem_joined_next_start hrun (h ▸ allClosed_mem_coalesceAll d m M N)

/-- The face-hitting event, by contrast, does carry a connection. -/
theorem allClosed_notMem_localFaceEvent (d m N : ℕ) (i : Fin d) :
    (∅ : SiteConfig (Site d)) ∉ localFaceEvent d m N := by
  rw [mem_localFaceEvent_iff]
  rintro ⟨y, -, h⟩
  obtain ⟨z, -, hconn⟩ := h i true
  exact Set.notMem_empty y hconn.1.1

/-- And so does the anchored event. -/
theorem allClosed_notMem_anchorGood (N : ℕ) (u : Site d) :
    (∅ : SiteConfig (Site d)) ∉ anchorGood N u := fun h => Set.notMem_empty (centre N u) h.1

end Coalescence

/-! ## The endpoint gluing reaches on its own -/

/-- The event that the anchored-good blocks contain an infinite coarse path out of `u₀`.  The path
is allowed to depend on the configuration, which is what makes the event a percolation event rather
than an infinite conjunction of independent ones. -/
def coarsePercolates (N : ℕ) (u₀ : Site d) : Set (SiteConfig (Site d)) :=
  {ω : SiteConfig (Site d) | ∃ v : ℕ → Site d, v 0 = u₀ ∧ Function.Injective v ∧
    (∀ k, (zdGraph d).Adj (v k) (v (k + 1))) ∧ ∀ k, ω ∈ anchorGood N (v k)}

/-- **Percolation from coarse percolation.**  No exploration, no pinned probability and no word
estimate: if the anchored-good blocks contain an infinite coarse path out of `u₀` with positive
probability, then the centre of the block `u₀` percolates.  This is the endpoint the gluing of this
module reaches on its own, and the form in which the geometric half of the renormalisation hands its
work to the probabilistic half. -/
theorem thetaSiteOn_pos_of_coarsePercolates (N : ℕ) (u₀ : Site d) (p : unitInterval)
    (hpos : 0 < (siteBernoulli fun _ : Site d => p).real (coarsePercolates N u₀)) :
    0 < thetaSiteOn (zdGraph d) (centre N u₀) p := by
  refine lt_of_lt_of_le hpos (measureReal_mono ?_ (measure_ne_top _ _))
  rintro ω ⟨v, hv0, hv, hadj, hgood⟩
  have h := infinite_siteCluster_of_coarse_walk N v hv hadj hgood
  rwa [hv0] at h

/-! ## Non-vacuity -/

section NonVacuity

/-- **A gluing event of explicitly positive probability.**  Two coarse-adjacent blocks of an
anchored schedule have their centres in one open cluster with probability at least the square of the
block constant. -/
theorem sq_le_prob_glue (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u) (p : unitInterval)
    (j k : ℕ) (hjk : j ≠ k) (hadj : (zdGraph d).Adj (u j) (u k)) :
    ((p : ℝ) ^ ((2 * N + 1) ^ d)) ^ 2
      ≤ (siteBernoulli fun _ : Site d => p).real
          {ω : SiteConfig (Site d) |
            centre N (u k) ∈ siteCluster (zdGraph d) ω (centre N (u j))} := by
  classical
  have hcard : ({j, k} : Finset ℕ).card = 2 := by
    rw [Finset.card_insert_of_notMem (by simpa using hjk), Finset.card_singleton]
  have hsub : (⋂ l ∈ ({j, k} : Finset ℕ), anchorGood N (u l))
      ⊆ {ω : SiteConfig (Site d) |
          centre N (u k) ∈ siteCluster (zdGraph d) ω (centre N (u j))} := by
    intro ω hω
    exact siteCluster_centre_of_coarse_adj N hadj
      (Set.mem_iInter₂.1 hω j (by simp)) (Set.mem_iInter₂.1 hω k (by simp))
  calc ((p : ℝ) ^ ((2 * N + 1) ^ d)) ^ 2
      = ((p : ℝ) ^ ((2 * N + 1) ^ d)) ^ ({j, k} : Finset ℕ).card := by rw [hcard]
    _ ≤ (siteBernoulli fun _ : Site d => p).real (⋂ l ∈ ({j, k} : Finset ℕ), anchorGood N (u l)) :=
        pow_le_prob_biInter_anchorGood d N u hu p {j, k}
    _ ≤ _ := measureReal_mono hsub (measure_ne_top _ _)

/-- **A completely explicit instance.**  In dimension three, with blocks of radius one placed along
a coarse ray and density one half, the anchored schedule has the one-step contract with the positive
constant `(1/2) ^ 27`, and the centres of its first two blocks lie in one open cluster with
probability at least `((1/2) ^ 27) ^ 2`, which is positive. -/
theorem anchor_explicit :
    (anchorSchedule 3 1 (coarseRay ⟨0, by norm_num⟩) (coarseRay_injective _)
        ⟨1 / 2, by constructor <;> norm_num⟩).walk.NextBound (1 - (1 / 2 : ℝ) ^ 27)
      ∧ (0 : ℝ) < ((1 / 2 : ℝ) ^ 27) ^ 2
      ∧ ((1 / 2 : ℝ) ^ 27) ^ 2
        ≤ (siteBernoulli fun _ : Site 3 => (⟨1 / 2, by constructor <;> norm_num⟩ : unitInterval)).real
            {ω : SiteConfig (Site 3) |
              centre 1 (coarseRay (⟨0, by norm_num⟩ : Fin 3) 1)
                ∈ siteCluster (zdGraph 3) ω (centre 1 (coarseRay ⟨0, by norm_num⟩ 0))} := by
  refine ⟨?_, by positivity, ?_⟩
  · have h := anchorSchedule_nextBound 3 1 (coarseRay (⟨0, by norm_num⟩ : Fin 3))
      (coarseRay_injective _) ⟨1 / 2, by constructor <;> norm_num⟩
    norm_num at h ⊢
    exact h
  · have h := sq_le_prob_glue 3 1 (coarseRay (⟨0, by norm_num⟩ : Fin 3)) (coarseRay_injective _)
      ⟨1 / 2, by constructor <;> norm_num⟩ 0 1 (by norm_num) (coarseRay_adj _ 0)
    norm_num at h ⊢
    exact h

end NonVacuity

end KNAll.Site.BlockGlue

end

section AxiomCheck

open KNAll.Site.BlockGlue

#print axioms KNAll.Site.BlockGlue.anchor_adj
#print axioms KNAll.Site.BlockGlue.connWithin_union_of_anchorGood
#print axioms KNAll.Site.BlockGlue.siteCluster_centre_of_coarse_adj
#print axioms KNAll.Site.BlockGlue.siteCluster_centre_of_coarse_walk
#print axioms KNAll.Site.BlockGlue.infinite_siteCluster_of_coarse_walk
#print axioms KNAll.Site.BlockGlue.determinedBy_anchorGood
#print axioms KNAll.Site.BlockGlue.pow_le_prob_anchorGood
#print axioms KNAll.Site.BlockGlue.prob_anchorGood_le
#print axioms KNAll.Site.BlockGlue.anchorSchedule_nextBound
#print axioms KNAll.Site.BlockGlue.prob_biInter_anchorGood
#print axioms KNAll.Site.BlockGlue.pow_le_prob_biInter_anchorGood
#print axioms KNAll.Site.BlockGlue.thetaSiteOn_pos_of_coarsePercolates
#print axioms KNAll.Site.BlockGlue.joined_of_runJoin
#print axioms KNAll.Site.BlockGlue.one_sub_rho_le_param_of_runJoin
#print axioms KNAll.Site.BlockGlue.prob_eq_zero_of_needs_open
#print axioms KNAll.Site.BlockGlue.one_le_of_nextBound_of_needs_open
#print axioms KNAll.Site.BlockGlue.one_le_of_nextBound_of_run_needs_open
#print axioms KNAll.Site.BlockGlue.one_le_of_runJoin_of_mem
#print axioms KNAll.Site.BlockGlue.joined_next_start_eq_empty_of_notMem
#print axioms KNAll.Site.BlockGlue.one_le_of_nextBound_of_runJoin
#print axioms KNAll.Site.BlockGlue.bernoulliReachProb_zero_reachesSize_one
#print axioms KNAll.Site.BlockGlue.absurd_of_runJoin_of_bernoulli
#print axioms KNAll.Site.BlockGlue.not_runJoin_anchorSchedule
#print axioms KNAll.Site.BlockGlue.exists_coalesceAll_prob_ge
#print axioms KNAll.Site.BlockGlue.allClosed_mem_coalesceAll
#print axioms KNAll.Site.BlockGlue.not_runJoin_of_joined_next_start_eq_coalesceAll
#print axioms KNAll.Site.BlockGlue.sq_le_prob_glue
#print axioms KNAll.Site.BlockGlue.anchor_explicit

end AxiomCheck
