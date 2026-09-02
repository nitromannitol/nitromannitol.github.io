# `KN.Projection` report

The module defines the vertex-set boundary and projected functional:

```lean
def KNAll.bar {V : Type*} (K : Set V) : Set (Sym2 V) :=
  {e | ∃ v ∈ e, v ∈ K}

def KNAll.projFunA {V : Type*}
    (w : Sym2 V → unitInterval) (a : V) (F : Set V → ℝ) (K : Set V) : ℝ :=
  F K - ∫ η, F (openCluster (η \ KNAll.bar K) a) ∂(prodBernoulli w)
```

It proves the following theorems:

```lean
theorem KNAll.barOf_singleton_eq_bar {V : Type*} [Fintype V]
    (o : V) (ω : BondConfig V) :
    BHK2006.barOf {o} (openEdgeCluster ω o) = KNAll.bar (openCluster ω o)

theorem KNAll.monotone_projFunA {V : Type*} [Fintype V]
    (w : Sym2 V → unitInterval) (a : V) (F : Set V → ℝ)
    (hF : ∀ K L : Set V, K ⊆ L → F K ≤ F L) :
    Monotone (KNAll.projFunA w a F)

theorem KNAll.setIntegral_sub_eq_projFunA {V : Type*} [Fintype V]
    (w : Sym2 V → unitInterval) (a o : V) (F : Set V → ℝ)
    (𝒮 : Set (Set (Sym2 V))) :
    ∫ ω in {ω : BondConfig V | ¬ (openGraph ω).Reachable o a} ∩
          {ω | openEdgeCluster ω o ∈ 𝒮},
        (F (openCluster ω o) - F (openCluster ω a)) ∂(prodBernoulli w) =
      ∫ ω in {ω : BondConfig V | ¬ (openGraph ω).Reachable o a} ∩
          {ω | openEdgeCluster ω o ∈ 𝒮},
        KNAll.projFunA w a F (openCluster ω o) ∂(prodBernoulli w)

theorem KNAll.setIntegral_sub_eq_projFunA_conn {V : Type*} [Fintype V]
    (w : Sym2 V → unitInterval) (a o : V) (F : Set V → ℝ) (T : Finset V) :
    ∫ ω in {ω : BondConfig V | ∀ y ∈ ({a} : Set V), ¬ (openGraph ω).Reachable o y} ∩
          (⋃ t ∈ T, openConn o t),
        (F (openCluster ω o) - F (openCluster ω a)) ∂(prodBernoulli w) =
      ∫ ω in {ω : BondConfig V | ∀ y ∈ ({a} : Set V), ¬ (openGraph ω).Reachable o y} ∩
          (⋃ t ∈ T, openConn o t),
        KNAll.projFunA w a F (openCluster ω o) ∂(prodBernoulli w)

theorem KNAll.setIntegral_projFunA_avoid {V : Type*} [Fintype V]
    (w : Sym2 V → unitInterval) (a o : V) (F : Set V → ℝ) :
    ∫ ω in {ω : BondConfig V | ∀ y ∈ ({a} : Set V), ¬ (openGraph ω).Reachable o y},
        KNAll.projFunA w a F (openCluster ω o) ∂(prodBernoulli w) =
      (∫ ω, F (openCluster ω o) ∂(prodBernoulli w)) -
        ∫ ω, F (openCluster ω a) ∂(prodBernoulli w)
```

Final compile output:

```text
EXIT=0
```
