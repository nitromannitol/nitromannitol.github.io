import KN.Conjectures

/-!
# Bernoulli site percolation: the model, the critical statement, and the finite input

This module states, in the vocabulary of the development, the two propositions that the manuscript
`site_percolation_criticality.tex` sets out to prove.  Nothing is proved here.

* `SiteCriticality d` is the assertion that nearest-neighbour Bernoulli **site** percolation on `ℤ^d`
  has no infinite open cluster at its critical parameter.  It is the site analogue of
  `Percolation.Literature.PercolationContinuity`, which the development proves for bond percolation.
* `HyperedgeGluing` is the finite input of the manuscript: in a finite model of independent
  hyperedges, `P(o ↔ b) ≥ P(o ↔ A) · min_{a ∈ A} P(a ↔ b)`.  For hyperedges of size two this is the
  bond statement `KNAll.Conjecture1`, which is proved in `KN/Conjectures.lean`.
* `PinnedSiteGluing` is the same inequality for site percolation on a finite graph when the named
  vertices are open with probability one, the form used by the lattice argument.

A site configuration is the set of open vertices.  Two vertices are connected when they are joined by
a path all of whose vertices are open; in particular a closed vertex is connected to nothing, not even
to itself, so the open cluster of a closed vertex is empty.
-/

noncomputable section

namespace KNAll.Site

open MeasureTheory Set Percolation.Literature Percolation.Literature.LatticeModels

/-! ## Site percolation on a graph -/

/-- A site configuration: the set of open vertices. -/
abbrev SiteConfig (V : Type*) : Type _ := Set V

variable {V : Type*}

/-- The graph of open vertices: an edge of `G` survives when both of its endpoints are open. -/
def openSiteGraph (G : SimpleGraph V) (ω : SiteConfig V) : SimpleGraph V :=
  SimpleGraph.fromRel fun x y => G.Adj x y ∧ x ∈ ω ∧ y ∈ ω

/-- The open cluster of `x`: empty when `x` is closed, and otherwise the set of vertices joined to
`x` by a path of open vertices. -/
def siteCluster (G : SimpleGraph V) (ω : SiteConfig V) (x : V) : Set V :=
  {y | x ∈ ω ∧ (openSiteGraph G ω).Reachable x y}

/-- The event that `x` and `y` are joined by a path of open vertices. -/
def siteConn (G : SimpleGraph V) (x y : V) : Set (SiteConfig V) :=
  {ω | x ∈ ω ∧ (openSiteGraph G ω).Reachable x y}

/-- The event that `x` is connected to some vertex of `A`. -/
def siteConnSet (G : SimpleGraph V) (x : V) (A : Set V) : Set (SiteConfig V) :=
  ⋃ a ∈ A, siteConn G x a

/-- Site percolation with vertex probabilities `w`: each vertex is open independently. -/
def siteBernoulli (w : V → unitInterval) : Measure (SiteConfig V) := prodBernoulli w

/-! ## The critical statement on the integer lattices -/

/-- The percolation probability of site percolation on `ℤ^d` at parameter `p`: the probability that
the open cluster of the origin is infinite. -/
def thetaSite (d : ℕ) (p : unitInterval) : ℝ :=
  (siteBernoulli (fun _ : Site d => p)).real
    {ω | (siteCluster (zdGraph d) ω (0 : Site d)).Infinite}

/-- The critical parameter of site percolation on `ℤ^d`, with the convention of
`Percolation.Literature.criticalProb`: the infimum is taken over the parameters at which the origin
percolates, together with `1`. -/
def criticalProbSite (d : ℕ) : ℝ :=
  sInf ({p : ℝ | ∃ h : p ∈ unitInterval, 0 < thetaSite d ⟨p, h⟩} ∪ {1})

/-- **The target of the manuscript**: at its critical parameter, site percolation on `ℤ^d` has no
infinite open cluster.  The site analogue of `Percolation.Literature.PercolationContinuity d`. -/
def SiteCriticality (d : ℕ) : Prop :=
  ∀ h : criticalProbSite d ∈ unitInterval, thetaSite d ⟨criticalProbSite d, h⟩ = 0

/-! ## The finite input -/

/-- A finite model of independent hyperedges: a label type `E`, an incidence map, and an opening
probability for each label.  A configuration is the set of open labels. -/
structure Hypergraph (V E : Type*) where
  /-- The vertices incident to a label. -/
  incidence : E → Set V
  /-- The probability that a label is open. -/
  prob : E → unitInterval

variable {E : Type*}

/-- Two vertices are adjacent when some open label is incident to both. -/
def openHyperGraph (H : Hypergraph V E) (ω : Set E) : SimpleGraph V :=
  SimpleGraph.fromRel fun x y => ∃ e ∈ ω, x ∈ H.incidence e ∧ y ∈ H.incidence e

/-- The event that a chain of open labels joins `x` to `y`.  Connectivity is reflexive here. -/
def hyperConn (H : Hypergraph V E) (x y : V) : Set (Set E) :=
  {ω | (openHyperGraph H ω).Reachable x y}

/-- **The finite input of the manuscript** (its Theorem on hyperedge gluing): in every finite model
of independent hyperedges, `P(o ↔ b) ≥ P(o ↔ A) · min_{a ∈ A} P(a ↔ b)`.  For incidence sets of size
two this is `KNAll.Conjecture1`. -/
def HyperedgeGluing : Prop :=
  ∀ (n m : ℕ) (H : Hypergraph (Fin n) (Fin m)) (A : Finset (Fin n)) (hA : A.Nonempty) (o b : Fin n),
    (prodBernoulli H.prob).real (⋃ a ∈ A, hyperConn H o a) *
        A.inf' hA (fun a => (prodBernoulli H.prob).real (hyperConn H a b)) ≤
      (prodBernoulli H.prob).real (hyperConn H o b)

/-- **The pinned site form** (its Corollary): the same inequality for site percolation on a finite
graph, when the observer, the target and every vertex of `A` are open with probability one. -/
def PinnedSiteGluing : Prop :=
  ∀ (n : ℕ) (G : SimpleGraph (Fin n)) (w : Fin n → unitInterval) (A : Finset (Fin n))
      (hA : A.Nonempty) (o b : Fin n),
    w o = 1 → w b = 1 → (∀ a ∈ A, w a = 1) →
    (siteBernoulli w).real (siteConnSet G o ↑A) *
        A.inf' hA (fun a => (siteBernoulli w).real (siteConn G a b)) ≤
      (siteBernoulli w).real (siteConn G o b)

end KNAll.Site

end
