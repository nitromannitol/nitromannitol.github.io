# KN.AvoidedClosure report

Created `KN/AvoidedClosure.lean`, importing `KN.AvoidedPeelTools`, with the following public theorems in namespace `KNAll` under `variable {n : ℕ}`.

## 1. `surplusY_eq_minForm`

```lean
theorem surplusY_eq_minForm (w : Sym2 (Fin n) → unitInterval) (Y : Set (Fin n))
    (T : Finset (Fin n)) (r : Fin n → ℕ) (F : Set (Fin n) → ℝ) (x : Fin n)
    (hr : Set.InjOn r ↑T)
    (hcompat : ∀ b ∈ T, ∀ b' ∈ T, r b < r b' → condMean w Y F b ≤ condMean w Y F b') :
    surplusY w Y T r F x =
      ∫ ω in { ω : BondConfig (Fin n) | ∀ y ∈ Y, ¬ (openGraph ω).Reachable x y } ∩
          ⋃ a ∈ T, openConn x a,
        (F (openCluster ω x) -
          (if h : (T.filter fun b => ω ∈ (openConn x b : Set (BondConfig (Fin n)))).Nonempty then
            (T.filter fun b => ω ∈ (openConn x b : Set (BondConfig (Fin n)))).inf' h
              (fun b => condMean w Y F b)
          else 0)) ∂(prodBernoulli w)
```

## 2. `continuousAt_condMean`

```lean
theorem continuousAt_condMean (Y : Set (Fin n)) (F : Set (Fin n) → ℝ) (a : Fin n)
    (w : Sym2 (Fin n) → unitInterval)
    (hw : 0 < (prodBernoulli w).real
      {ω : BondConfig (Fin n) | ∀ y ∈ Y, ¬ (openGraph ω).Reachable a y}) :
    ContinuousAt (fun p : Sym2 (Fin n) → unitInterval => condMean p Y F a) w
```

## 3. `continuousAt_minFormY`

```lean
theorem continuousAt_minFormY (Y : Set (Fin n)) (T : Finset (Fin n))
    (F : Set (Fin n) → ℝ) (x : Fin n) (w : Sym2 (Fin n) → unitInterval)
    (hact : ∀ a ∈ T, 0 < (prodBernoulli w).real
      {ω : BondConfig (Fin n) | ∀ y ∈ Y, ¬ (openGraph ω).Reachable a y}) :
    ContinuousAt (fun p : Sym2 (Fin n) → unitInterval =>
      ∫ ω in { ω : BondConfig (Fin n) | ∀ y ∈ Y, ¬ (openGraph ω).Reachable x y } ∩
          ⋃ a ∈ T, openConn x a,
        (F (openCluster ω x) -
          (if h : (T.filter fun b => ω ∈ (openConn x b : Set (BondConfig (Fin n)))).Nonempty then
            (T.filter fun b => ω ∈ (openConn x b : Set (BondConfig (Fin n)))).inf' h
              (fun b => condMean p Y F b)
          else 0)) ∂(prodBernoulli p)) w
```

## 4. `weights_le_of_forall_pos_lt_one_at`

```lean
theorem weights_le_of_forall_pos_lt_one_at
    {f g : (Sym2 (Fin n) → unitInterval) → ℝ} (w : Sym2 (Fin n) → unitInterval)
    (hf : ContinuousAt f w) (hg : ContinuousAt g w)
    (h : ∀ p, (∀ e, 0 < p e ∧ p e < 1) → f p ≤ g p) : f w ≤ g w
```

## 5. `surplusTransferY_of_nondegenerate`

```lean
theorem surplusTransferY_of_nondegenerate (Y : Set (Fin n)) (T : Finset (Fin n))
    (o v : Fin n) (F : Set (Fin n) → ℝ)
    (h : ∀ p : Sym2 (Fin n) → unitInterval, (∀ e, 0 < p e ∧ p e < 1) →
      ∀ r : Fin n → ℕ, Set.InjOn r ↑T →
        (∀ a ∈ T, ∀ a' ∈ T, r a < r a' →
          condMean p Y F a ≤ condMean p Y F a') →
        (prodBernoulli p).real
            ({ω : BondConfig (Fin n) |
                ∀ a ∈ Y ∪ (↑T : Set (Fin n)), ¬ (openGraph ω).Reachable v a} ∩ openConn o v) *
              surplusY p Y T r F v ≤
          (prodBernoulli p).real
              {ω : BondConfig (Fin n) |
                ∀ a ∈ Y ∪ (↑T : Set (Fin n)), ¬ (openGraph ω).Reachable v a} *
              surplusY p Y T r F o)
    (w : Sym2 (Fin n) → unitInterval)
    (hact : ∀ a ∈ T, 0 < (prodBernoulli w).real
      {ω : BondConfig (Fin n) | ∀ y ∈ Y, ¬ (openGraph ω).Reachable a y})
    (r : Fin n → ℕ) (hr : Set.InjOn r ↑T)
    (hcompat : ∀ a ∈ T, ∀ a' ∈ T, r a < r a' →
      condMean w Y F a ≤ condMean w Y F a') :
    (prodBernoulli w).real
        ({ω : BondConfig (Fin n) |
            ∀ a ∈ Y ∪ (↑T : Set (Fin n)), ¬ (openGraph ω).Reachable v a} ∩ openConn o v) *
          surplusY w Y T r F v ≤
      (prodBernoulli w).real
          {ω : BondConfig (Fin n) |
            ∀ a ∈ Y ∪ (↑T : Set (Fin n)), ¬ (openGraph ω).Reachable v a} *
          surplusY w Y T r F o
```

## Final compile output

```text
EXIT=0
```
