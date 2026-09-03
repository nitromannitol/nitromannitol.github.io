import KN.BondRepresentation
import KN.SiteRepresentation
open KNAll.Site KNAll.Bond
/-- **One finite inequality about hypergraphs implies both models.**  Bond percolation is the case
of labels incident to two vertices; site percolation is the port representation. -/
theorem gluing_bond_and_site (h : HyperedgeGluing) :
    KNAll.Conjecture1 ∧ SiteGluingUnpinned :=
  ⟨conjecture1_of_hyperedgeGluing h, siteGluingUnpinned_of_hyperedgeGluing h⟩
#print axioms gluing_bond_and_site
