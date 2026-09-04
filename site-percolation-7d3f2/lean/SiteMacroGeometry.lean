import KN.ReachCoupling
import KN.SiteIntrinsicInputs
import KN.MacroToSlab

/-!
# The one-step estimate of the block exploration

`KN/ReachCoupling.lean` couples an adaptive block exploration to the product measure and reduces the
renormalisation to a single inequality, `SiteWalk.NextBound`: after every admissible transcript the
block examined next is joined with pinned probability at least `1 - rho`.  This module builds
explorations for which that inequality is proved rather than assumed, proves the transfer it feeds,
and delimits exactly which part of the composite the inequality does not reach.

## The reading of `joined`, and why it has to be local

`NextBound` quantifies over every admissible transcript, and `SiteWalk` asks admissibility to be
preserved by either answer, so the bound has to hold after failures as well as after successes.
Two readings of `joined` are available.

The first reads `joined m` as "block `m` is joined to the growing cluster", which is the reading
that `SiteWalk.thetaSiteOn_pos` consumes: its hypothesis `hjoin` asks that `joined m` imply that
block `m` meets the open cluster of the root `x`.  The section *Why the block event has to be local*
shows that this reading cannot carry a non-trivial one-step bound.  An open cluster of `x` is empty
unless `x` is open, so `hjoin` forces `joined m ⊆ {x is open}` for every block, however far it is
from `x` (`joined_subset_root_open`).  Three consequences follow.  A transcript that has read `x`
and found it closed gives every joining event pinned probability zero
(`prob_joined_eq_zero_of_root_closed`), so `NextBound rho` at such a transcript forces `1 ≤ rho`
(`one_le_of_nextBound_of_root_closed`).  Such a transcript is produced by the exploration itself:
run it against the all-closed configuration, and as soon as the root has been inspected the contract
is empty (`one_le_of_nextBound_of_run_inspects_root`).  And at a transcript that has not read the
root the bound is capped by the density (`one_sub_rho_le_param`).  So an exploration meeting `hjoin`
may never inspect its own root, and where the bound is not empty it is a lower bound for the
probability that the cluster of `x` reaches a block disjoint from everything read so far, which is a
statement of the strength of the conclusion the renormalisation is after.

The second reading, the one taken here, is that `joined m` is decided by the sites of block `m`.
Freshness then does all the work: the examined block has not been looked at, so the transcript pins
no site the event can see, and `MacroHistory.prob_eq_of_determinedBy_compl` turns the pinned
probability into the unconditional one.  That is `BlockSchedule.walk_nextBound`, and it is the
one-step estimate this module delivers.

## What is proved

* `BlockSchedule` is a family of pairwise disjoint blocks of a common size, listed in the order they
  are examined, each carrying an event decided by its own sites.  `BlockSchedule.walk` is the
  corresponding `SiteWalk`, `BlockSchedule.walk_step_admissible` its admissibility invariant.
* `BlockSchedule.walk_nextBound`: a uniform lower bound `c` on the unconditional probabilities of
  the block events is the one-step contract at `rho = 1 - c`.  No hypothesis on the geometry, on the
  parameter or on the shape of the events is used beyond disjointness and locality.
* `BlockSchedule.walk_transfer`: the composite with `SiteWalk.bernoulliReachProb_le_prob_run`.  The
  pattern of successes along the exploration dominates independent Bernoulli(`c`) trials.
* `BlockSchedule.prob_biInter_good` and `BlockSchedule.pow_le_prob_biInter_good`: the block events
  are independent, so a finite conjunction of them has probability the product, at least `c ^ n`.
* `faceSchedule` is the geometric instance.  Its blocks are boxes of radius `N` centred at the
  coarse points `centre N (u k)`, spaced `2N + 1` apart so that they are disjoint
  (`faceBlock_disjoint`), and its block events are the confined face-hitting events of
  `KN/SiteIntrinsicInputs.lean`, read in the configuration seen from those centres.  Translation
  invariance of the product measure gives every block the probability of the event at the origin
  (`prob_faceGood`).
* `exists_faceSchedule_nextBound` and `exists_faceSchedule_transfer` read the contract and the
  transfer off `SiteIntrinsicInputs d p`, which `KNAll.Site.siteIntrinsicInputs_of_thetaSite_pos`
  produces from `0 < thetaSite d p`.  These are the one-step estimate from supercriticality.
* `slabCoarse` places the coarse points in a coarse plane, `slabFaceWalk` is the resulting
  exploration, and `slabFaceWalk_block_subset_slab` shows that every block, hence the whole
  exploration, stays inside a slab of width `2N + 1`.  `exists_slabFaceWalk_nextBound` and
  `exists_slabFaceWalk_transfer` are the contract and the transfer for it.
* `thetaSiteOn_pos_of_runJoin` is `SiteWalk.thetaSiteOn_pos` with its joining hypothesis replaced by
  `RunJoin`, which asks only that the blocks a *run* declares occupied meet the cluster of `x`, in
  the configuration that run reads.  `runJoin_of_forall` proves that `RunJoin` is implied by the
  hypothesis it replaces, so this is a strictly weaker hypothesis, and unlike its predecessor it is
  not refuted by the section on the frontier: it is a property of a whole transcript, which is what
  a coarse-cluster exploration can maintain, rather than a property of one block in isolation.

## What is assumed, and what is missing

Every theorem below is proved outright.  The only hypothesis carried by the one-step estimate is
`SiteIntrinsicInputs d p`, which `KN/GateTwoChain.lean` proves from supercriticality alone, so the
estimate is unconditional.

The renormalisation is *not* completed here.  Two further inputs are missing, and both are named as
hypotheses of `thetaSiteOn_pos_of_runJoin` rather than assumed anywhere.

* **Gluing.**  Nothing proves that the clusters witnessing the face-hitting events of two
  coarse-adjacent blocks are joined to one another.  Without it an occupied block is a good block
  and nothing more, and `RunJoin` cannot be discharged for any exploration.  The blocks tile: boxes
  of side `2N + 1` at spacing `2N + 1` leave no site between coarse neighbours, so what is missing
  is not room but information.  The face-hitting event does not say where on a face the cluster
  arrives, so the clusters of two coarse-adjacent good blocks can arrive at disjoint parts of the
  shared boundary.  Reading the block events on overlapping regions repairs that and costs
  independence, which then calls for a domination theorem for finitely dependent fields; neither is
  in this development.  A gluing argument will also need the geometric reading of `faceGood` as the
  translate of the event at the origin, which the adjacency of `ℤ^d` supplies and which is not
  proved here.
* **The Bernoulli word estimate.**  `SiteWalk.thetaSiteOn_pos` and `thetaSiteOn_pos_of_runJoin` both
  ask for a positive `c` with `c ≤ bernoulliReachProb (1 - rho) (reachesSize k) (steps k)` for every
  `k`.  Nothing in the development supplies it; it is a law-of-large-numbers estimate for the
  Bernoulli word measure.

## A defect in the import graph

`KN.ReachCoupling` and `KN.GateTwoChain` cannot be imported together: both environments contain
`KNAll.Site.determinedBy_setOf_mem`, declared once in `KN/ReachCoupling.lean` and once in
`KN/SiteSlabGeometry.lean`, which `KN.GateTwoChain` reaches through `KN.SiteLocalFromUniqueness` and
`KN.SiteFiniteEnergy`.  The clash is between those two files and has nothing to do with this one.
It is why `SiteIntrinsicInputs d p` appears below as a hypothesis rather than being obtained from
`0 < thetaSite d p` on the spot, and why the translation invariance of the site measure is proved
again here (`measurePreserving_shiftCfg`) instead of being taken from
`KN.SiteLocalFromUniqueness`.  Renaming either declaration would remove the obstruction.
-/

noncomputable section

namespace KNAll.Site.MacroGeom

open MeasureTheory Set KN Percolation.Literature Percolation.Literature.LatticeModels

variable {d : ℕ}

/-! ## Translation -/

section Shift

/-- The configuration seen from `v`: the site `x` is open in `shiftCfg v ω` exactly when `x + v` is
open in `ω`. -/
def shiftCfg (v : Site d) (ω : SiteConfig (Site d)) : SiteConfig (Site d) :=
  restrictSite (fun x => x + v) ω

@[simp] theorem mem_shiftCfg (v : Site d) (ω : SiteConfig (Site d)) (x : Site d) :
    x ∈ shiftCfg v ω ↔ x + v ∈ ω := Iff.rfl

theorem measurable_shiftCfg (v : Site d) : Measurable (shiftCfg (d := d) v) :=
  measurable_restrictSite _

theorem measurePreserving_shiftCfg (p : unitInterval) (v : Site d) :
    MeasurePreserving (shiftCfg (d := d) v) (siteBernoulli fun _ : Site d => p)
      (siteBernoulli fun _ : Site d => p) :=
  ⟨measurable_shiftCfg v, siteBernoulli_map_restrictSite (add_left_injective v) p⟩

/-- The event `A`, read in the configuration seen from `v`. -/
def shiftEvent (v : Site d) (A : Set (SiteConfig (Site d))) : Set (SiteConfig (Site d)) :=
  shiftCfg v ⁻¹' A

theorem measurableSet_shiftEvent (v : Site d) {A : Set (SiteConfig (Site d))}
    (hA : MeasurableSet A) : MeasurableSet (shiftEvent v A) :=
  measurable_shiftCfg v hA

theorem prob_shiftEvent (p : unitInterval) (v : Site d) {A : Set (SiteConfig (Site d))}
    (hA : MeasurableSet A) :
    (siteBernoulli fun _ : Site d => p).real (shiftEvent v A)
      = (siteBernoulli fun _ : Site d => p).real A := by
  have h := (measurePreserving_shiftCfg p v).measure_preimage hA.nullMeasurableSet
  rw [measureReal_def, measureReal_def, shiftEvent, h]

theorem determinedBy_shiftEvent (v : Site d) {A : Set (SiteConfig (Site d))}
    {F : Finset (Site d)} (hA : DeterminedBy A (↑F : Set (Site d))) :
    DeterminedBy (shiftEvent v A) (↑(F.image (fun x => x + v)) : Set (Site d)) := by
  classical
  rw [determinedBy_iff] at hA ⊢
  intro ω ω' hω
  refine hA _ _ ?_
  have key : ∀ y : Site d, y ∈ F → (y + v ∈ ω ↔ y + v ∈ ω') := by
    intro y hy
    have hmem : y + v ∈ (↑(F.image (fun x => x + v)) : Set (Site d)) := by
      simp only [Finset.coe_image, Set.mem_image, Finset.mem_coe]
      exact ⟨y, hy, rfl⟩
    constructor
    · intro h; exact ((Set.ext_iff.1 hω (y + v)).1 ⟨h, hmem⟩).1
    · intro h; exact ((Set.ext_iff.1 hω (y + v)).2 ⟨h, hmem⟩).1
  ext y
  simp only [Set.mem_inter_iff, mem_shiftCfg, Finset.mem_coe]
  exact ⟨fun h => ⟨(key y h.2).1 h.1, h.2⟩, fun h => ⟨(key y h.2).2 h.1, h.2⟩⟩

end Shift

/-! ## Block schedules -/

section Schedule

/-- A schedule of disjoint blocks of a common size, each carrying a block-local event. -/
structure BlockSchedule (d : ℕ) where
  /-- The blocks, in the order they are examined. -/
  blk : ℕ → Finset (Site d)
  /-- Their common cardinality. -/
  size : ℕ
  /-- Blocks are not empty. -/
  size_pos : 0 < size
  /-- Every block has that cardinality. -/
  blk_card : ∀ k, (blk k).card = size
  /-- Distinct blocks are disjoint. -/
  blk_disjoint : ∀ k l : ℕ, k ≠ l → Disjoint (blk k) (blk l)
  /-- The event attached to a block. -/
  good : ℕ → Set (SiteConfig (Site d))
  /-- It is decided by the sites of that block. -/
  good_det : ∀ k, DeterminedBy (good k) (↑(blk k) : Set (Site d))
  /-- It is measurable. -/
  good_meas : ∀ k, MeasurableSet (good k)
  /-- The density of the underlying site percolation. -/
  param : unitInterval

namespace BlockSchedule

variable (S : BlockSchedule d)

/-- The sites inspected after the first `n` examinations. -/
def seen (n : ℕ) : Finset (Site d) := (Finset.range n).biUnion S.blk

theorem card_seen (n : ℕ) : (S.seen n).card = n * S.size := by
  classical
  rw [seen, Finset.card_biUnion fun k _ l _ hkl => S.blk_disjoint k l hkl]
  simp [S.blk_card]

theorem card_seen_div (n : ℕ) : (S.seen n).card / S.size = n := by
  rw [S.card_seen n, Nat.mul_div_cancel _ S.size_pos]

theorem disjoint_blk_seen (n : ℕ) : Disjoint (S.blk n) (S.seen n) := by
  classical
  rw [seen, Finset.disjoint_biUnion_right]
  exact fun k hk => S.blk_disjoint n k (Nat.ne_of_gt (Finset.mem_range.1 hk))

theorem seen_succ (n : ℕ) : S.seen (n + 1) = S.seen n ∪ S.blk n := by
  classical
  rw [seen, seen, Finset.range_add_one, Finset.biUnion_insert, Finset.union_comm]

/-- **The exploration attached to a block schedule.**  The blocks are examined in the order they
are listed.  A transcript is admissible when the sites it has inspected are exactly the first `n`
blocks and every block it has declared occupied is one of those; the number of inspected sites is
then `n` times the common block size, so the index of the block examined next is read off the
transcript by dividing.  Every hypothesis of `SiteWalk` that carries content follows from
disjointness of the blocks and locality of the block events. -/
def walk : SiteWalk d where
  Index := ℕ
  decEq := inferInstance
  block := S.blk
  block_disjoint := by
    intro k l hkl
    rw [Finset.disjoint_coe]
    exact S.blk_disjoint k l hkl
  density _ := S.param
  joined := S.good
  joined_measurable := S.good_meas
  Admissible h := ∃ n : ℕ, h.inspected = S.seen n ∧ h.occupied ⊆ Finset.range n
  start := ⟨∅, ∅, Finset.Subset.refl _, ∅⟩
  start_admissible := ⟨0, by simp [BlockSchedule.seen], by simp⟩
  start_inspected := rfl
  start_occupied := rfl
  next h := h.inspected.card / S.size
  next_notMem_occupied := by
    rintro h ⟨n, hn, hocc⟩
    rw [hn, S.card_seen_div]
    exact fun hmem => absurd (Finset.mem_range.1 (hocc hmem)) (lt_irrefl n)
  next_block_fresh := by
    rintro h ⟨n, hn, hocc⟩
    rw [hn, S.card_seen_div, Finset.disjoint_coe]
    exact S.disjoint_blk_seen n
  joined_determinedBy := by
    intro h _
    exact (S.good_det _).mono Set.subset_union_right

theorem walk_next_eq {h : MacroHistory d S.walk.Index} {n : ℕ} (hn : h.inspected = S.seen n) :
    S.walk.next h = n := by
  show h.inspected.card / S.size = n
  rw [hn, S.card_seen_div]

/-- Every examination keeps the transcript admissible. -/
theorem walk_step_admissible (h : MacroHistory d S.walk.Index) (b : Bool)
    (ω : SiteConfig (Site d)) (hh : S.walk.Admissible h) :
    S.walk.Admissible (S.walk.step h b ω) := by
  classical
  obtain ⟨n, hn, hocc⟩ := hh
  refine ⟨n + 1, ?_, ?_⟩
  · show h.inspected ∪ S.blk (h.inspected.card / S.size) = S.seen (n + 1)
    rw [hn, S.card_seen_div, S.seen_succ]
  · show (if b then insert (h.inspected.card / S.size) h.occupied else h.occupied)
        ⊆ Finset.range (n + 1)
    rw [hn, S.card_seen_div]
    have hmono : h.occupied ⊆ Finset.range (n + 1) := fun a ha =>
      Finset.mem_range.2 (Nat.lt_succ_of_lt (Finset.mem_range.1 (hocc ha)))
    cases b with
    | false => simpa using hmono
    | true => exact Finset.insert_subset (Finset.mem_range.2 (Nat.lt_succ_self n)) hmono

/-- **The one-step contract, from the unconditional block probabilities.**  The examined block has
never been looked at, so the transcript pins no site the block event can see and the pinned
probability of that event is its unconditional probability. -/
theorem walk_nextBound {c : ℝ}
    (hc : ∀ k, c ≤ (siteBernoulli fun _ : Site d => S.param).real (S.good k)) :
    S.walk.NextBound (1 - c) := by
  intro h hh
  obtain ⟨n, hn, hocc⟩ := hh
  have hnext : S.walk.next h = n := S.walk_next_eq hn
  have hdet : DeterminedBy (S.good n) ((↑h.inspected : Set (Site d))ᶜ) := by
    refine (S.good_det n).mono ?_
    intro y hy
    rw [Set.mem_compl_iff, hn, Finset.mem_coe]
    exact fun hy' => Finset.disjoint_left.1 (S.disjoint_blk_seen n) (Finset.mem_coe.1 hy) hy'
  have hval : h.prob S.walk.density (S.walk.joined (S.walk.next h))
      = (siteBernoulli fun _ : Site d => S.param).real (S.good n) := by
    rw [hnext]
    exact MacroHistory.prob_eq_of_determinedBy_compl h _ hdet
  rw [sub_sub_cancel, hval]
  exact hc n

/-- **The transfer.**  The Bernoulli(`c`) reach probability of an upward-closed word event is a
lower bound for the product-measure probability that the run of the exploration produces such a
word. -/
theorem walk_transfer {c : ℝ} (hc0 : 0 ≤ c) (hc1 : c ≤ 1)
    (hc : ∀ k, c ≤ (siteBernoulli fun _ : Site d => S.param).real (S.good k))
    (A : List Bool → Prop) (hA : MonoWord A) (n : ℕ) :
    bernoulliReachProb c A n
      ≤ (prodBernoulli fun _ : Site d => S.param).real
          {ω | A (S.walk.run n S.walk.start ω)} := by
  have hb := S.walk.bernoulliReachProb_le_prob_run (rho := 1 - c) (by linarith) (by linarith)
    (fun h b ω hh => S.walk_step_admissible h b ω hh) (S.walk_nextBound hc) A hA n
  rwa [sub_sub_cancel] at hb

/-! ### The block field is independent -/

theorem determinedBy_univ (K : Set (Site d)) :
    DeterminedBy (Set.univ : Set (SiteConfig (Site d))) K := by
  rw [determinedBy_iff]
  intro ω ω' _
  simp

/-- **The good blocks are independent events.**  They are decided by pairwise disjoint sets of
sites, so the probability of a finite conjunction is the product of the probabilities. -/
theorem prob_biInter_good (F : Finset ℕ) :
    (siteBernoulli fun _ : Site d => S.param).real (⋂ k ∈ F, S.good k)
      = ∏ k ∈ F, (siteBernoulli fun _ : Site d => S.param).real (S.good k) := by
  classical
  have h := prodBernoulli_real_inter_biInter_of_determinedBy
    (p := fun _ : Site d => S.param) (s := F) (S := S.blk)
    (fun k _ l _ hkl => S.blk_disjoint k l hkl)
    (fun k _ => S.good_det k) (fun k _ => S.good_meas k)
    (A := Set.univ) (determinedBy_univ _) MeasurableSet.univ
  rw [Set.univ_inter, probReal_univ, one_mul] at h
  exact h

/-- A uniform lower bound on the block probabilities gives one on their conjunction. -/
theorem pow_le_prob_biInter_good {c : ℝ} (hc0 : 0 ≤ c)
    (hc : ∀ k, c ≤ (siteBernoulli fun _ : Site d => S.param).real (S.good k)) (F : Finset ℕ) :
    c ^ F.card ≤ (siteBernoulli fun _ : Site d => S.param).real (⋂ k ∈ F, S.good k) := by
  rw [S.prob_biInter_good F, ← Finset.prod_const]
  exact Finset.prod_le_prod (fun k _ => hc0) (fun k _ => hc k)

end BlockSchedule

end Schedule

/-! ## The geometric schedule -/

section Geometry

/-- The centre of the block with coarse index `u`, at spacing `2N+1`. -/
def centre (N : ℕ) (u : Site d) : Site d := fun i => (2 * (N : ℤ) + 1) * u i

@[simp] theorem centre_apply (N : ℕ) (u : Site d) (i : Fin d) :
    centre N u i = (2 * (N : ℤ) + 1) * u i := rfl

/-- The block with coarse index `u`: the box of radius `N` translated to `centre N u`. -/
def faceBlock (N : ℕ) (u : Site d) : Finset (Site d) :=
  (box d N).image (fun x => x + centre N u)

theorem faceBlock_card (N : ℕ) (u : Site d) : (faceBlock N u).card = (2 * N + 1) ^ d := by
  rw [faceBlock, Finset.card_image_of_injective _ (add_left_injective _), card_box]

/-- **Blocks at distinct coarse indices are disjoint.**  The spacing `2N+1` exceeds the diameter
`2N` of a block, so two blocks sharing a site have equal coarse indices. -/
theorem faceBlock_disjoint (N : ℕ) {u u' : Site d} (h : u ≠ u') :
    Disjoint (faceBlock N u) (faceBlock N u') := by
  classical
  rw [Finset.disjoint_left]
  rintro y hy hy'
  rw [faceBlock, Finset.mem_image] at hy hy'
  obtain ⟨x, hx, rfl⟩ := hy
  obtain ⟨x', hx', hxy⟩ := hy'
  rw [mem_box] at hx hx'
  refine h (funext fun i => ?_)
  by_contra hne
  have hco : x' i + (2 * (N : ℤ) + 1) * u' i = x i + (2 * (N : ℤ) + 1) * u i := by
    have := congrFun hxy i
    simpa using this
  have hkey : (2 * (N : ℤ) + 1) * (u i - u' i) = x' i - x i := by
    rw [mul_sub]; linarith
  have habs1 : (1 : ℤ) ≤ |u i - u' i| := Int.one_le_abs (sub_ne_zero.2 hne)
  have hpos : (0 : ℤ) ≤ 2 * (N : ℤ) + 1 := by positivity
  have hbig : 2 * (N : ℤ) + 1 ≤ |(2 * (N : ℤ) + 1) * (u i - u' i)| := by
    rw [abs_mul, abs_of_nonneg hpos]
    exact le_mul_of_one_le_right hpos habs1
  have hsmall : |(2 * (N : ℤ) + 1) * (u i - u' i)| ≤ 2 * (N : ℤ) := by
    rw [hkey, abs_le]
    exact ⟨by linarith [(hx i).1, (hx i).2, (hx' i).1, (hx' i).2],
      by linarith [(hx i).1, (hx i).2, (hx' i).1, (hx' i).2]⟩
  linarith

/-- Along a coarse direction that the index does not use, a block stays inside the slab of width
`2N+1`.  Choosing the coarse indices inside a coarse plane therefore confines every block, and hence
the whole exploration, to a slab of finite width. -/
theorem faceBlock_coord_le (N : ℕ) (u : Site d) {y : Site d} (hy : y ∈ faceBlock N u)
    (i : Fin d) (hi : u i = 0) : -(N : ℤ) ≤ y i ∧ y i ≤ N := by
  classical
  rw [faceBlock, Finset.mem_image] at hy
  obtain ⟨x, hx, rfl⟩ := hy
  rw [mem_box] at hx
  have : (x + centre N u) i = x i := by simp [hi]
  rw [this]
  exact hx i

/-- The confined face-hitting event of `KN/SiteIntrinsicInputs.lean`, read in the configuration
seen from `centre N u`.  What is proved about it below is what the schedule needs: it is decided by
the sites of `faceBlock N u`, and it has the probability of the event at the origin.  That it is
also the geometric translate of that event, which holds because the adjacency of `ℤ^d` is
translation invariant, is not needed here and is not proved. -/
def faceGood (m N : ℕ) (u : Site d) : Set (SiteConfig (Site d)) :=
  shiftEvent (centre N u) (localFaceEvent d m N)

theorem determinedBy_faceGood (m N : ℕ) (u : Site d) :
    DeterminedBy (faceGood m N u) (↑(faceBlock N u) : Set (Site d)) :=
  determinedBy_shiftEvent _ (determinedBy_localFaceEvent d m N)

theorem measurableSet_faceGood (m N : ℕ) (u : Site d) : MeasurableSet (faceGood m N u) :=
  measurableSet_shiftEvent _ (measurableSet_localFaceEvent d m N)

/-- **The block events all have the probability of the face-hitting event at the origin**, by
translation invariance of the product measure. -/
theorem prob_faceGood (m N : ℕ) (u : Site d) (p : unitInterval) :
    (siteBernoulli fun _ : Site d => p).real (faceGood m N u)
      = (siteBernoulli fun _ : Site d => p).real (localFaceEvent d m N) :=
  prob_shiftEvent p _ (measurableSet_localFaceEvent d m N)

/-- **The geometric block schedule.**  Blocks are boxes of radius `N` centred at the coarse points
`u k`, spaced `2N+1` apart; the block event is the confined face-hitting event of that box. -/
def faceSchedule (d m N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u) (p : unitInterval) :
    BlockSchedule d where
  blk k := faceBlock N (u k)
  size := (2 * N + 1) ^ d
  size_pos := pow_pos (by omega) d
  blk_card k := faceBlock_card N (u k)
  blk_disjoint k l hkl := faceBlock_disjoint N fun hEq => hkl (hu hEq)
  good k := faceGood m N (u k)
  good_det k := determinedBy_faceGood m N (u k)
  good_meas k := measurableSet_faceGood m N (u k)
  param := p

/-- **The one-step contract for the geometric schedule.**  After every admissible transcript the
block examined next is face-hitting with pinned probability at least `1 - η`. -/
theorem faceSchedule_nextBound (d m N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u)
    (p : unitInterval) {η : ℝ}
    (hη : 1 - η ≤ (siteBernoulli fun _ : Site d => p).real (localFaceEvent d m N)) :
    (faceSchedule d m N u hu p).walk.NextBound η := by
  have h := (faceSchedule d m N u hu p).walk_nextBound (c := 1 - η) fun k => by
    show (1 : ℝ) - η ≤ (siteBernoulli fun _ : Site d => p).real (faceGood m N (u k))
    rw [prob_faceGood]
    exact hη
  rwa [sub_sub_cancel] at h

/-! ### From the confined local inputs -/

/-- **The one-step contract, from supercriticality.**  `SiteIntrinsicInputs d p` is what
`KNAll.Site.siteIntrinsicInputs_of_thetaSite_pos` produces from `0 < thetaSite d p`. -/
theorem exists_faceSchedule_nextBound (d : ℕ) (p : unitInterval) (H : SiteIntrinsicInputs d p)
    (u : ℕ → Site d) (hu : Function.Injective u) {η : ℝ} (hη : 0 < η) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, ∃ N ≥ m, (faceSchedule d m N u hu p).walk.NextBound η := by
  obtain ⟨m₀, hm₀⟩ := H.faceHit η hη
  refine ⟨m₀, fun m hm => ?_⟩
  obtain ⟨N, hNm, hN⟩ := hm₀ m hm
  exact ⟨N, hNm, faceSchedule_nextBound d m N u hu p hN⟩

/-- **The transfer, from supercriticality.**  Along the coarse exploration the pattern of
face-hitting blocks dominates independent Bernoulli(`1 - η`) trials. -/
theorem exists_faceSchedule_transfer (d : ℕ) (p : unitInterval) (H : SiteIntrinsicInputs d p)
    (u : ℕ → Site d) (hu : Function.Injective u) {η : ℝ} (hη0 : 0 < η) (hη1 : η ≤ 1) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, ∃ N ≥ m, ∀ A : List Bool → Prop, MonoWord A → ∀ n : ℕ,
      bernoulliReachProb (1 - η) A n
        ≤ (prodBernoulli fun _ : Site d => p).real
            {ω | A ((faceSchedule d m N u hu p).walk.run n
                  (faceSchedule d m N u hu p).walk.start ω)} := by
  obtain ⟨m₀, hm₀⟩ := H.faceHit η hη0
  refine ⟨m₀, fun m hm => ?_⟩
  obtain ⟨N, hNm, hN⟩ := hm₀ m hm
  refine ⟨N, hNm, fun A hA n => ?_⟩
  refine (faceSchedule d m N u hu p).walk_transfer (by linarith) (by linarith) ?_ A hA n
  intro k
  show (1 : ℝ) - η ≤ (siteBernoulli fun _ : Site d => p).real (faceGood m N (u k))
  rw [prob_faceGood]
  exact hN

/-! ### A coarse plane of blocks, confined to a slab -/

/-- A coarse index that moves only in the first two coordinates. -/
def slabCoarse (d : ℕ) (_h2 : 2 ≤ d) (k : ℕ) : Site d := fun i =>
  if i.val = 0 then (k.unpair.1 : ℤ) else if i.val = 1 then (k.unpair.2 : ℤ) else 0

theorem slabCoarse_injective (d : ℕ) (h2 : 2 ≤ d) :
    Function.Injective (slabCoarse d h2) := by
  intro k l hkl
  have h0 := congrFun hkl ⟨0, by omega⟩
  have h1 := congrFun hkl ⟨1, by omega⟩
  simp only [slabCoarse] at h0 h1
  norm_num at h0 h1
  rw [← Nat.pair_unpair k, ← Nat.pair_unpair l, h0, h1]

theorem slabCoarse_apply_eq_zero (d : ℕ) (h2 : 2 ≤ d) (k : ℕ) {i : Fin d} (hi : 2 ≤ i.val) :
    slabCoarse d h2 k i = 0 := by
  have h0 : i.val ≠ 0 := by omega
  have h1 : i.val ≠ 1 := by omega
  simp [slabCoarse, h0, h1]

/-- **Every block of the coarse plane lies in a slab of width `2N+1`.**  The exploration therefore
never leaves that slab, which is what the slab reduction asks of it. -/
theorem faceBlock_slabCoarse_subset_slab (d N : ℕ) (h2 : 2 ≤ d) (k : ℕ) {y : Site d}
    (hy : y ∈ faceBlock N (slabCoarse d h2 k)) {i : Fin d} (hi : 2 ≤ i.val) :
    -(N : ℤ) ≤ y i ∧ y i ≤ N :=
  faceBlock_coord_le N _ hy i (slabCoarse_apply_eq_zero d h2 k hi)

/-- **The slab exploration.**  Boxes of radius `N`, placed on a coarse plane and spaced `2N + 1`
apart, examined one after another; a block is declared occupied when some site of it is joined
inside it to all `2d` faces of the inner box of radius `m`. -/
def slabFaceWalk (d m N : ℕ) (h2 : 2 ≤ d) (p : unitInterval) : SiteWalk d :=
  (faceSchedule d m N (slabCoarse d h2) (slabCoarse_injective d h2) p).walk

/-- **The exploration never leaves a slab of width `2N + 1`.** -/
theorem slabFaceWalk_block_subset_slab (d m N : ℕ) (h2 : 2 ≤ d) (p : unitInterval)
    (k : (slabFaceWalk d m N h2 p).Index) {y : Site d}
    (hy : y ∈ (slabFaceWalk d m N h2 p).block k) {i : Fin d} (hi : 2 ≤ i.val) :
    -(N : ℤ) ≤ y i ∧ y i ≤ N :=
  faceBlock_slabCoarse_subset_slab d N h2 k hy hi

/-- Every examination of the slab exploration keeps the transcript admissible. -/
theorem slabFaceWalk_step_admissible (d m N : ℕ) (h2 : 2 ≤ d) (p : unitInterval)
    (h : MacroHistory d (slabFaceWalk d m N h2 p).Index) (b : Bool) (ω : SiteConfig (Site d))
    (hh : (slabFaceWalk d m N h2 p).Admissible h) :
    (slabFaceWalk d m N h2 p).Admissible ((slabFaceWalk d m N h2 p).step h b ω) :=
  BlockSchedule.walk_step_admissible _ h b ω hh

/-- **The one-step contract of the slab exploration, from supercriticality.**  For every `η > 0`
there is an inner scale beyond which every outer box large enough gives an exploration whose next
block is good with pinned probability at least `1 - η`, after every admissible transcript. -/
theorem exists_slabFaceWalk_nextBound (d : ℕ) (h2 : 2 ≤ d) (p : unitInterval)
    (H : SiteIntrinsicInputs d p) {η : ℝ} (hη : 0 < η) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, ∃ N ≥ m, (slabFaceWalk d m N h2 p).NextBound η :=
  exists_faceSchedule_nextBound d p H (slabCoarse d h2) (slabCoarse_injective d h2) hη

/-- **The transfer for the slab exploration.** -/
theorem exists_slabFaceWalk_transfer (d : ℕ) (h2 : 2 ≤ d) (p : unitInterval)
    (H : SiteIntrinsicInputs d p) {η : ℝ} (hη0 : 0 < η) (hη1 : η ≤ 1) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, ∃ N ≥ m, ∀ A : List Bool → Prop, MonoWord A → ∀ n : ℕ,
      bernoulliReachProb (1 - η) A n
        ≤ (prodBernoulli fun _ : Site d => p).real
            {ω | A ((slabFaceWalk d m N h2 p).run n (slabFaceWalk d m N h2 p).start ω)} :=
  exists_faceSchedule_transfer d p H (slabCoarse d h2) (slabCoarse_injective d h2) hη0 hη1

end Geometry

/-! ## Non-vacuity -/

section NonVacuity

/-- The event that every site of a finite set is open. -/
def allOpen (F : Finset (Site d)) : Set (SiteConfig (Site d)) := {ω | (↑F : Set (Site d)) ⊆ ω}

theorem determinedBy_allOpen (F : Finset (Site d)) :
    DeterminedBy (allOpen F) (↑F : Set (Site d)) := by
  rw [determinedBy_iff]
  intro ω ω' hω
  have key : ∀ y ∈ (↑F : Set (Site d)), (y ∈ ω ↔ y ∈ ω') := by
    intro y hy
    exact ⟨fun h => ((Set.ext_iff.1 hω y).1 ⟨h, hy⟩).1,
      fun h => ((Set.ext_iff.1 hω y).2 ⟨h, hy⟩).1⟩
  exact ⟨fun h y hy => (key y hy).1 (h hy), fun h y hy => (key y hy).2 (h hy)⟩

theorem measurableSet_allOpen (F : Finset (Site d)) : MeasurableSet (allOpen F) :=
  (determinedBy_allOpen F).measurableSet_of_finset

theorem prob_allOpen (p : unitInterval) (F : Finset (Site d)) :
    (siteBernoulli fun _ : Site d => p).real (allOpen F) = (p : ℝ) ^ F.card := by
  rw [show (siteBernoulli fun _ : Site d => p) = prodBernoulli fun _ : Site d => p from rfl]
  rw [allOpen, prodBernoulli_real_subset, Finset.prod_const]

/-- **An explicit schedule whose one-step bound is a positive number that can be written down.**
The blocks are the boxes of the coarse plane, and a block is good when all of its sites are open. -/
def openSchedule (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u) (p : unitInterval) :
    BlockSchedule d where
  blk k := faceBlock N (u k)
  size := (2 * N + 1) ^ d
  size_pos := pow_pos (by omega) d
  blk_card k := faceBlock_card N (u k)
  blk_disjoint k l hkl := faceBlock_disjoint N fun hEq => hkl (hu hEq)
  good k := allOpen (faceBlock N (u k))
  good_det k := determinedBy_allOpen _
  good_meas k := measurableSet_allOpen _
  param := p

theorem openSchedule_nextBound (d N : ℕ) (u : ℕ → Site d) (hu : Function.Injective u)
    (p : unitInterval) :
    (openSchedule d N u hu p).walk.NextBound (1 - (p : ℝ) ^ ((2 * N + 1) ^ d)) := by
  refine (openSchedule d N u hu p).walk_nextBound (c := (p : ℝ) ^ ((2 * N + 1) ^ d)) fun k => ?_
  show (p : ℝ) ^ ((2 * N + 1) ^ d)
      ≤ (siteBernoulli fun _ : Site d => p).real (allOpen (faceBlock N (u k)))
  rw [prob_allOpen, faceBlock_card]

/-- **The bound is genuinely positive**, so the one-step contract is satisfiable rather than
vacuous: at any positive density the explicit schedule above has
`1 - rho = p ^ (2N+1)^d > 0`. -/
theorem openSchedule_bound_pos (d N : ℕ) (p : unitInterval) (hp : 0 < (p : ℝ)) :
    0 < 1 - (1 - (p : ℝ) ^ ((2 * N + 1) ^ d)) := by
  rw [sub_sub_cancel]
  exact pow_pos hp _

/-- **A completely explicit instance.**  In dimension three, with blocks of radius one placed on
the coarse plane and density one half, the one-step contract holds with the positive constant
`(1/2) ^ 27`. -/
theorem openSchedule_explicit :
    (openSchedule 3 1 (slabCoarse 3 (by norm_num)) (slabCoarse_injective 3 (by norm_num))
        ⟨1 / 2, by constructor <;> norm_num⟩).walk.NextBound (1 - (1 / 2 : ℝ) ^ 27)
      ∧ (0 : ℝ) < (1 / 2 : ℝ) ^ 27 := by
  refine ⟨?_, by positivity⟩
  have h := openSchedule_nextBound 3 1 (slabCoarse 3 (by norm_num))
    (slabCoarse_injective 3 (by norm_num)) ⟨1 / 2, by constructor <;> norm_num⟩
  norm_num at h ⊢
  exact h

end NonVacuity

/-! ## Why the block event has to be local -/

section Frontier

variable {S : SiteWalk d} {G : SimpleGraph (Site d)} {x : Site d}

/-- **A transcript that has read the root and found it closed kills every joining event.**  If
`joined m` implies that the block `m` meets the open cluster of `x`, then it implies that `x` is
open; a transcript that pins `x` closed therefore gives it pinned probability zero.  Nothing here
depends on which block is examined. -/
theorem prob_joined_eq_zero_of_root_closed
    (hjoin : ∀ (m : S.Index) (ω : SiteConfig (Site d)), ω ∈ S.joined m →
      ∃ y ∈ (↑(S.block m) : Set (Site d)), y ∈ siteCluster G ω x)
    (h : MacroHistory d S.Index) (hx : x ∈ h.inspected) (hxc : x ∉ h.openSites) (m : S.Index) :
    h.prob S.density (S.joined m) = 0 := by
  have hempty : substitute (↑h.inspected : Set (Site d)) h.state ⁻¹' S.joined m = ∅ := by
    ext ω
    simp only [Set.mem_preimage, Set.mem_empty_iff_false, iff_false]
    intro hmem
    obtain ⟨y, -, hy⟩ := hjoin m _ hmem
    have hxopen : x ∈ substitute (↑h.inspected : Set (Site d)) h.state ω := hy.1
    rw [mem_substitute_of_mem _ (Finset.mem_coe.2 hx)] at hxopen
    exact hxc hxopen
  rw [MacroHistory.prob_eq, pinnedProb, hempty, measureReal_empty]

/-- **The one-step contract is unavailable once the root has been read and found closed.**  Any
`rho` for which `NextBound rho` holds at such a transcript is at least `1`, so the contract carries
no information there. -/
theorem one_le_of_nextBound_of_root_closed
    (hjoin : ∀ (m : S.Index) (ω : SiteConfig (Site d)), ω ∈ S.joined m →
      ∃ y ∈ (↑(S.block m) : Set (Site d)), y ∈ siteCluster G ω x)
    {rho : ℝ} (hS : S.NextBound rho) {h : MacroHistory d S.Index} (hadm : S.Admissible h)
    (hx : x ∈ h.inspected) (hxc : x ∉ h.openSites) : 1 ≤ rho := by
  have h0 := hS h hadm
  rw [prob_joined_eq_zero_of_root_closed hjoin h hx hxc] at h0
  linarith

/-- **A joining event forces the root open.**  An open cluster of `x` is empty unless `x` is open,
so a block event that implies "this block meets the cluster of `x`" implies "`x` is open", however
far the block is from `x`. -/
theorem joined_subset_root_open
    (hjoin : ∀ (m : S.Index) (ω : SiteConfig (Site d)), ω ∈ S.joined m →
      ∃ y ∈ (↑(S.block m) : Set (Site d)), y ∈ siteCluster G ω x) (m : S.Index) :
    S.joined m ⊆ {ω : SiteConfig (Site d) | x ∈ ω} := by
  intro ω hω
  obtain ⟨y, -, hy⟩ := hjoin m ω hω
  exact hy.1

/-- **The contract is capped by the density.**  At a transcript that has not read the root, the
one-step bound cannot exceed the probability that the root is open, whatever the block examined and
however large it is. -/
theorem one_sub_rho_le_param
    (hjoin : ∀ (m : S.Index) (ω : SiteConfig (Site d)), ω ∈ S.joined m →
      ∃ y ∈ (↑(S.block m) : Set (Site d)), y ∈ siteCluster G ω x)
    {rho : ℝ} (hS : S.NextBound rho) {h : MacroHistory d S.Index} (hadm : S.Admissible h)
    (hx : x ∉ h.inspected) {p : unitInterval} (hden : S.density = fun _ => p) :
    1 - rho ≤ (p : ℝ) := by
  have hmono : h.prob S.density (S.joined (S.next h))
      ≤ h.prob S.density {ω : SiteConfig (Site d) | x ∈ ω} := by
    rw [MacroHistory.prob_eq, MacroHistory.prob_eq, pinnedProb, pinnedProb]
    exact measureReal_mono (Set.preimage_mono (joined_subset_root_open hjoin (S.next h)))
      (measure_ne_top _ _)
  have hdet : DeterminedBy {ω : SiteConfig (Site d) | x ∈ ω} ((↑h.inspected : Set (Site d))ᶜ) := by
    refine (determinedBy_setOf_mem_coord x).mono ?_
    rw [Set.singleton_subset_iff, Set.mem_compl_iff, Finset.mem_coe]
    exact hx
  have hval : h.prob S.density {ω : SiteConfig (Site d) | x ∈ ω} = (p : ℝ) := by
    rw [MacroHistory.prob_eq_of_determinedBy_compl h _ hdet, hden,
      prodBernoulli_real_setOf_mem]
  have := hS h hadm
  linarith [hval ▸ hmono]

/-! ### Such a transcript is reached by the exploration itself -/

theorem start_openSites (S : SiteWalk d) : S.start.openSites = ∅ :=
  Finset.subset_empty.1 (S.start_inspected ▸ S.start.openSites_subset)

theorem step_openSites_of_empty (S : SiteWalk d) (h : MacroHistory d S.Index) (b : Bool)
    (hh : h.openSites = ∅) : (S.step h b (∅ : Set (Site d))).openSites = ∅ := by
  classical
  simp [SiteWalk.step, hh]

theorem runHist_openSites_of_empty (S : SiteWalk d) :
    ∀ (n : ℕ) (h : MacroHistory d S.Index), h.openSites = ∅ →
      (S.runHist n h (∅ : Set (Site d))).openSites = ∅ := by
  intro n
  induction n with
  | zero => intro h hh; simpa using hh
  | succ n ih =>
    intro h hh
    rw [S.runHist_succ]
    exact ih _ (step_openSites_of_empty S h _ hh)

theorem admissible_runHist (S : SiteWalk d)
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω)) :
    ∀ (n : ℕ) (h : MacroHistory d S.Index) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.runHist n h ω) := by
  intro n
  induction n with
  | zero => intro h ω hh; simpa using hh
  | succ n ih =>
    intro h ω hh
    rw [S.runHist_succ]
    exact ih _ ω (hadm h _ ω hh)

/-- **The obstruction, in the form it bites.**  Run the exploration against the all-closed
configuration.  If at some stage it has read the root, then no `rho < 1` satisfies the one-step
contract, whatever the exploration and whatever the graph.  So an exploration whose block events
imply a connection to a fixed root cannot be allowed to inspect that root, and in particular the
block containing the root can never be examined. -/
theorem one_le_of_nextBound_of_run_inspects_root
    (hjoin : ∀ (m : S.Index) (ω : SiteConfig (Site d)), ω ∈ S.joined m →
      ∃ y ∈ (↑(S.block m) : Set (Site d)), y ∈ siteCluster G ω x)
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω))
    {rho : ℝ} (hS : S.NextBound rho) (n : ℕ)
    (hx : x ∈ (S.runHist n S.start (∅ : Set (Site d))).inspected) : 1 ≤ rho := by
  refine one_le_of_nextBound_of_root_closed hjoin hS
    (admissible_runHist S hadm n S.start (∅ : Set (Site d)) S.start_admissible) hx ?_
  rw [runHist_openSites_of_empty S n S.start (start_openSites S)]
  exact Finset.notMem_empty x

end Frontier

/-! ## The conclusion, with the hypothesis the geometry can meet -/

section RunJoin

/-- **The run form of the joining hypothesis.**  Only the blocks a run actually declares occupied
have to meet the open cluster of `x`, and only in the configuration the run reads.  This is what an
exploration of a coarse cluster can deliver: the invariant that every occupied block is coarsely
connected to the first one is a property of the whole transcript, not of one block. -/
def RunJoin (S : SiteWalk d) (G : SimpleGraph (Site d)) (x : Site d) : Prop :=
  ∀ (n : ℕ) (ω : SiteConfig (Site d)) (m : S.Index),
    m ∈ (S.runHist n S.start ω).occupied →
      ∃ y ∈ (↑(S.block m) : Set (Site d)), y ∈ siteCluster G ω x

/-- `RunJoin` is weaker than the blockwise hypothesis of `SiteWalk.thetaSiteOn_pos`: a block is
declared occupied only after the joining event has been observed. -/
theorem runJoin_of_forall (S : SiteWalk d) (G : SimpleGraph (Site d)) (x : Site d)
    (hjoin : ∀ (m : S.Index) (ω : SiteConfig (Site d)), ω ∈ S.joined m →
      ∃ y ∈ (↑(S.block m) : Set (Site d)), y ∈ siteCluster G ω x) :
    RunJoin S G x := by
  intro n ω m hm
  rcases S.mem_occupied_runHist n S.start ω m hm with h1 | h2
  · rw [S.start_occupied] at h1
    exact absurd h1 (Finset.notMem_empty m)
  · exact hjoin m ω h2

/-- **An infinite cluster from the exploration, under `RunJoin`.**  This is
`KNAll.Site.SiteWalk.thetaSiteOn_pos` with its joining hypothesis weakened to `RunJoin`; the proof
is the same, because the strong hypothesis is used there only at the blocks a run declares
occupied. -/
theorem thetaSiteOn_pos_of_runJoin (S : SiteWalk d) (G : SimpleGraph (Site d)) (x : Site d)
    (p : unitInterval) (hden : S.density = fun _ => p)
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω))
    (hrun : RunJoin S G x)
    {rho c : ℝ} (hrho0 : 0 ≤ rho) (hrho1 : rho ≤ 1) (hS : S.NextBound rho) (hc : 0 < c)
    (steps : ℕ → ℕ)
    (hbern : ∀ k : ℕ, c ≤ bernoulliReachProb (1 - rho) (reachesSize k) (steps k)) :
    0 < thetaSiteOn G x p := by
  classical
  refine thetaSiteOn_pos_of_cells G x p (fun m => (↑(S.block m) : Set (Site d)))
    S.block_disjoint c hc fun k => ?_
  refine ((hbern k).trans (S.bernoulliReachProb_le_prob_run hrho0 hrho1 hadm hS
    (reachesSize k) (monoWord_reachesSize k) (steps k))).trans ?_
  rw [hden]
  refine measureReal_mono ?_ (measure_ne_top _ _)
  rintro ω hω
  have hcount := S.add_numJoined_le_card_runHist hadm (steps k) S.start S.start_admissible ω
  rw [S.start_occupied, Finset.card_empty, Nat.zero_add] at hcount
  have hcard : k ≤ (S.runHist (steps k) S.start ω).occupied.card := le_trans hω hcount
  have hex : ∀ m ∈ (S.runHist (steps k) S.start ω).occupied,
      ∃ y, y ∈ (↑(S.block m) : Set (Site d)) ∧ y ∈ siteCluster G ω x := by
    intro m hm
    obtain ⟨y, hy1, hy2⟩ := hrun (steps k) ω m hm
    exact ⟨y, hy1, hy2⟩
  choose! rep hrep1 hrep2 using hex
  exact ⟨_, rep, hcard, hrep1, hrep2⟩

end RunJoin

end KNAll.Site.MacroGeom

end

section AxiomCheck

open KNAll.Site.MacroGeom

#print axioms KNAll.Site.MacroGeom.BlockSchedule.walk_nextBound
#print axioms KNAll.Site.MacroGeom.BlockSchedule.walk_transfer
#print axioms KNAll.Site.MacroGeom.BlockSchedule.prob_biInter_good
#print axioms KNAll.Site.MacroGeom.faceSchedule_nextBound
#print axioms KNAll.Site.MacroGeom.exists_faceSchedule_nextBound
#print axioms KNAll.Site.MacroGeom.exists_faceSchedule_transfer
#print axioms KNAll.Site.MacroGeom.faceBlock_slabCoarse_subset_slab
#print axioms KNAll.Site.MacroGeom.slabFaceWalk_block_subset_slab
#print axioms KNAll.Site.MacroGeom.exists_slabFaceWalk_nextBound
#print axioms KNAll.Site.MacroGeom.exists_slabFaceWalk_transfer
#print axioms KNAll.Site.MacroGeom.openSchedule_explicit
#print axioms KNAll.Site.MacroGeom.prob_joined_eq_zero_of_root_closed
#print axioms KNAll.Site.MacroGeom.one_le_of_nextBound_of_run_inspects_root
#print axioms KNAll.Site.MacroGeom.one_sub_rho_le_param
#print axioms KNAll.Site.MacroGeom.thetaSiteOn_pos_of_runJoin

end AxiomCheck
