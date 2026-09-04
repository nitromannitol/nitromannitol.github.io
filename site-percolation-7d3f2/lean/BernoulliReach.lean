import KN.MacroStep

/-!
# The Bernoulli word estimate

`KNAll.Site.SiteWalk.thetaSiteOn_pos` and `KNAll.Site.MacroGeom.thetaSiteOn_pos_of_runJoin` both
carry the hypothesis

```
hbern : ∀ k, c ≤ bernoulliReachProb (1 - rho) (reachesSize k) (steps k)
```

with `0 < c`, for a step count `steps` the caller is free to choose.  This file discharges it.

Unwinding the definitions, `bernoulliReachProb a (reachesSize k) n` is the probability that a word
of `n` independent Bernoulli(`a`) letters carries at least `k` letters `true`, so the hypothesis
asks for a step count along which the binomial tail stays bounded away from zero.  The bound has to
be uniform in `k`: the geometry intersects the events over all `k`, and a constant degrading with
`k` would leave nothing in the limit.  The all-successes word contributes `a ^ n`, which is uniform
in nothing, so the estimate cannot come from a single word; it is a law of large numbers.

## The route

Chebyshev's inequality, in a form that never leaves the recursion `walkProb` is defined by.
`walkExp q f n h` averages a real-valued `f` over the length-`n` continuations of the history `h`
by the same recursion, and `walkProb q A n h` is `walkExp q f n h` for `f` the indicator of `A`.
Two facts about `walkExp` at the constant law suffice:

* `mul_walkProb_le_walkExp`, Markov's inequality: if `A` forces `f` to be at least `t` and `f` is
  nonnegative, then `t` times the probability of `A` is at most the average of `f`.
* `walkExp_centered_sq`, an exact computation: the average of `(numJoined w - m) ^ 2` over the
  length-`n` continuations of `h` is `(numJoined h + n * a - m) ^ 2 + n * a * (1 - a)`.  Reading it
  at `m = numJoined h + n * a` leaves the variance `n * a * (1 - a)`.

Applying the first to the second at `m = n * a` and `h = []`, on the event that fewer than `k`
letters are `true`, gives `mul_walkProb_not_reachesSize_le`.  Once `n * a` is at least `2 * k + 8`
the deviation `n * a - k` is at least `n * a / 2` and the variance `n * a * (1 - a)` is at most
`n * a`, so the failure probability is at most `4 / (n * a) ≤ 1 / 2`.  The constant is `1 / 2` and
`steps a k = ⌈(2 * k + 8) / a⌉₊` is a step count that works.

## The range of validity

The bound holds for every `a` with `0 < a ≤ 1`, that is for every `rho` with `0 ≤ rho < 1`, and the
downstream theorems assume only `0 ≤ rho` and `rho ≤ 1`.  The endpoint `rho = 1` is not an artefact
of the proof: `bernoulliReachProb_zero` computes `bernoulliReachProb 0 (reachesSize k) n = 0` for
every `n` and every `k ≥ 1`, so `not_exists_uniform_at_rho_one` refutes the hypothesis there.  A
consumer must therefore supply `rho < 1` on top of what it already assumes.  That costs nothing:
`SiteWalk.NextBound S 1` reads `0 ≤ h.prob S.density (S.joined (S.next h))`, so a one-step contract
at `rho = 1` carries no information about the exploration at all.

## Main statements

* `walkExp`, the averaging functional, with `walkProb_eq_walkExp_indicator` identifying it with
  `walkProb` on indicators;
* `mul_walkProb_le_walkExp`, Markov's inequality;
* `walkProb_add_compl`, the complement of an event;
* `walkExp_numJoined` and `walkExp_centered_sq`, the first two moments of the number of successes;
* `mul_walkProb_not_reachesSize_le`, Chebyshev's inequality for the count;
* `half_le_bernoulliReachProb`, the tail bound at any step count with `2 * k + 8 ≤ n * a`;
* `steps` and `half_le_bernoulliReachProb_steps`, an explicit step count;
* `exists_steps_bernoulliReachProb_one_sub`, the hypothesis `hbern` in the shape the geometry asks
  for, with `c = 1 / 2`;
* `bernoulliReachProb_zero` and `not_exists_uniform_at_rho_one`, the failure at `rho = 1`;
* `bernoulliReachProb_one_step`, `bernoulliReachProb_two_steps` and
  `half_le_bernoulliReachProb_explicit`, exact small values and a concrete instance.
-/

namespace KNAll.Site.BReach

open KN

/-! ## Averaging a real-valued function along the recursion -/

/-- `walkExp q f n h` is the average of `f` over the length-`n` continuations of the history `h`,
when after any history `g` the next letter is `true` with probability `q g`.  It is `walkProb` with
the indicator of an event replaced by an arbitrary real-valued function. -/
noncomputable def walkExp (q : List Bool → ℝ) (f : List Bool → ℝ) :
    ℕ → List Bool → ℝ
  | 0,     h => f h
  | n + 1, h => q h * walkExp q f n (h ++ [true]) + (1 - q h) * walkExp q f n (h ++ [false])

theorem walkExp_zero (q : List Bool → ℝ) (f : List Bool → ℝ) (h : List Bool) :
    walkExp q f 0 h = f h := by
  simp only [walkExp]

theorem walkExp_succ (q : List Bool → ℝ) (f : List Bool → ℝ) (n : ℕ) (h : List Bool) :
    walkExp q f (n + 1) h
      = q h * walkExp q f n (h ++ [true]) + (1 - q h) * walkExp q f n (h ++ [false]) := by
  simp only [walkExp]

open Classical in
/-- `walkProb` is `walkExp` applied to an indicator: the two recursions are the same recursion. -/
theorem walkProb_eq_walkExp_indicator (q : List Bool → ℝ) (A : List Bool → Prop) (n : ℕ)
    (h : List Bool) :
    walkProb q A n h = walkExp q (fun w => if A w then 1 else 0) n h := by
  induction n generalizing h with
  | zero => rw [walkProb_zero, walkExp_zero]
  | succ n ih => rw [walkProb_succ, walkExp_succ, ih, ih]

/-- Averaging a constant returns it, whatever the branching law. -/
theorem walkExp_const (q : List Bool → ℝ) (c : ℝ) (n : ℕ) (h : List Bool) :
    walkExp q (fun _ => c) n h = c := by
  induction n generalizing h with
  | zero => rw [walkExp_zero]
  | succ n ih => rw [walkExp_succ, ih, ih]; ring

/-! ## Markov's inequality -/

/-- **Markov's inequality.**  If `f` is nonnegative and the event `A` forces `f` to be at least
`t`, then `t` times the probability of `A` is at most the average of `f`.  Nothing is assumed of
`A` beyond that implication, and nothing of the branching law beyond its values lying in `[0,1]`. -/
theorem mul_walkProb_le_walkExp (q : List Bool → ℝ) (hq0 : ∀ g, 0 ≤ q g) (hq1 : ∀ g, q g ≤ 1)
    (A : List Bool → Prop) (f : List Bool → ℝ) (t : ℝ)
    (hf : ∀ w, 0 ≤ f w) (hA : ∀ w, A w → t ≤ f w) (n : ℕ) (h : List Bool) :
    t * walkProb q A n h ≤ walkExp q f n h := by
  classical
  induction n generalizing h with
  | zero =>
    rw [walkProb_zero, walkExp_zero]
    by_cases hAh : A h
    · rw [if_pos hAh, mul_one]
      exact hA h hAh
    · rw [if_neg hAh, mul_zero]
      exact hf h
  | succ n ih =>
    rw [walkProb_succ, walkExp_succ]
    have h0 : 0 ≤ q h := hq0 h
    have h1 : (0 : ℝ) ≤ 1 - q h := by linarith [hq1 h]
    have hT := mul_le_mul_of_nonneg_left (ih (h ++ [true])) h0
    have hF := mul_le_mul_of_nonneg_left (ih (h ++ [false])) h1
    have key : t * (q h * walkProb q A n (h ++ [true])
          + (1 - q h) * walkProb q A n (h ++ [false]))
        = q h * (t * walkProb q A n (h ++ [true]))
          + (1 - q h) * (t * walkProb q A n (h ++ [false])) := by ring
    rw [key]
    linarith

/-- An event and its complement have probabilities summing to one. -/
theorem walkProb_add_compl (q : List Bool → ℝ) (A : List Bool → Prop) (n : ℕ) (h : List Bool) :
    walkProb q A n h + walkProb q (fun w => ¬ A w) n h = 1 := by
  classical
  induction n generalizing h with
  | zero =>
    rw [walkProb_zero, walkProb_zero]
    by_cases hAh : A h
    · rw [if_pos hAh, if_neg (not_not_intro hAh)]; ring
    · rw [if_neg hAh, if_pos hAh]; ring
  | succ n ih =>
    rw [walkProb_succ, walkProb_succ]
    have hT := ih (h ++ [true])
    have hF := ih (h ++ [false])
    have eT : walkProb q (fun w => ¬ A w) n (h ++ [true])
        = 1 - walkProb q A n (h ++ [true]) := by linarith
    have eF : walkProb q (fun w => ¬ A w) n (h ++ [false])
        = 1 - walkProb q A n (h ++ [false]) := by linarith
    rw [eT, eF]; ring

/-! ## The number of successes along a word -/

theorem numJoined_nil : numJoined [] = 0 := by
  simp only [numJoined]

theorem numJoined_cons_true (w : List Bool) : numJoined (true :: w) = numJoined w + 1 := by
  simp only [numJoined]

theorem numJoined_cons_false (w : List Bool) : numJoined (false :: w) = numJoined w := by
  simp only [numJoined]

theorem numJoined_append (u v : List Bool) :
    numJoined (u ++ v) = numJoined u + numJoined v := by
  induction u with
  | nil => rw [List.nil_append, numJoined_nil, Nat.zero_add]
  | cons b u ih =>
    cases b with
    | false => rw [List.cons_append, numJoined_cons_false, numJoined_cons_false, ih]
    | true =>
      rw [List.cons_append, numJoined_cons_true, numJoined_cons_true, ih]
      omega

theorem numJoined_snoc_true (h : List Bool) : numJoined (h ++ [true]) = numJoined h + 1 := by
  rw [numJoined_append, numJoined_cons_true, numJoined_nil]

theorem numJoined_snoc_false (h : List Bool) : numJoined (h ++ [false]) = numJoined h := by
  rw [numJoined_append, numJoined_cons_false, numJoined_nil, Nat.add_zero]

/-! ## The first two moments of the number of successes -/

/-- The mean: `n` further letters add `n * a` successes on average. -/
theorem walkExp_numJoined (a : ℝ) (n : ℕ) (h : List Bool) :
    walkExp (fun _ => a) (fun w => (numJoined w : ℝ)) n h = (numJoined h : ℝ) + n * a := by
  induction n generalizing h with
  | zero =>
    rw [walkExp_zero]
    push_cast
    ring
  | succ n ih =>
    simp only [walkExp_succ, ih, numJoined_snoc_true, numJoined_snoc_false]
    push_cast
    ring

/-- The centred second moment, computed exactly and for an arbitrary centre `m`.  At
`m = numJoined h + n * a` the first square vanishes and what is left is the variance
`n * a * (1 - a)`. -/
theorem walkExp_centered_sq (a m : ℝ) (n : ℕ) (h : List Bool) :
    walkExp (fun _ => a) (fun w => ((numJoined w : ℝ) - m) ^ 2) n h
      = ((numJoined h : ℝ) + n * a - m) ^ 2 + n * a * (1 - a) := by
  induction n generalizing h with
  | zero =>
    rw [walkExp_zero]
    push_cast
    ring
  | succ n ih =>
    simp only [walkExp_succ, ih, numJoined_snoc_true, numJoined_snoc_false]
    push_cast
    ring

theorem walkExp_variance (a : ℝ) (n : ℕ) :
    walkExp (fun _ => a) (fun w => ((numJoined w : ℝ) - (n : ℝ) * a) ^ 2) n []
      = (n : ℝ) * a * (1 - a) := by
  rw [walkExp_centered_sq, numJoined_nil]
  push_cast
  ring

/-! ## Chebyshev's inequality for the number of successes -/

/-- **Chebyshev's inequality.**  Once the mean `n * a` is at least twice the target `k`, the
probability that a Bernoulli(`a`) word of length `n` carries fewer than `k` successes obeys the
displayed bound; dividing by `(n * a) ^ 2` when that is positive reads it as
`4 * (1 - a) / (n * a)`. -/
theorem mul_walkProb_not_reachesSize_le (a : ℝ) (ha0 : 0 ≤ a) (ha1 : a ≤ 1) (k n : ℕ)
    (hk : 2 * (k : ℝ) ≤ (n : ℝ) * a) :
    ((n : ℝ) * a) ^ 2 * walkProb (fun _ => a) (fun w => ¬ reachesSize k w) n []
      ≤ 4 * ((n : ℝ) * a) * (1 - a) := by
  have hthr : ∀ w : List Bool, (fun w => ¬ reachesSize k w) w →
      ((n : ℝ) * a / 2) ^ 2 ≤ ((numJoined w : ℝ) - (n : ℝ) * a) ^ 2 := by
    intro w hw
    have hw' : ¬ (k ≤ numJoined w) := hw
    have h1 : numJoined w ≤ k := le_of_lt (Nat.not_le.mp hw')
    have h2 : (numJoined w : ℝ) ≤ (k : ℝ) := by exact_mod_cast h1
    have h3 : (n : ℝ) * a / 2 ≤ (n : ℝ) * a - (numJoined w : ℝ) := by linarith
    have h4 : (0 : ℝ) ≤ (n : ℝ) * a / 2 := by linarith
    nlinarith [h3, h4]
  have hMark := mul_walkProb_le_walkExp (fun _ => a) (fun _ => ha0) (fun _ => ha1)
    (fun w => ¬ reachesSize k w) (fun w => ((numJoined w : ℝ) - (n : ℝ) * a) ^ 2)
    (((n : ℝ) * a / 2) ^ 2) (fun w => sq_nonneg _) hthr n []
  rw [walkExp_variance] at hMark
  linarith

/-! ## The uniform lower bound -/

/-- **The estimate.**  A Bernoulli(`a`) word of length `n` carries at least `k` successes with
probability at least `1 / 2`, whenever the mean `n * a` is at least `2 * k + 8`.  The constant does
not depend on `k`, which is the whole point: `n` is allowed to grow with `k`, the bound is not. -/
theorem half_le_bernoulliReachProb (a : ℝ) (ha0 : 0 ≤ a) (ha1 : a ≤ 1) (k n : ℕ)
    (hn : 2 * (k : ℝ) + 8 ≤ (n : ℝ) * a) :
    (1 / 2 : ℝ) ≤ bernoulliReachProb a (reachesSize k) n := by
  have hkR : (0 : ℝ) ≤ (k : ℝ) := Nat.cast_nonneg k
  have hk : 2 * (k : ℝ) ≤ (n : ℝ) * a := by linarith
  have hna : (8 : ℝ) ≤ (n : ℝ) * a := by linarith
  have hs : (0 : ℝ) < (n : ℝ) * a := by linarith
  have hcheb := mul_walkProb_not_reachesSize_le a ha0 ha1 k n hk
  have hP0 : 0 ≤ walkProb (fun _ => a) (fun w => ¬ reachesSize k w) n [] :=
    walkProb_nonneg _ (fun _ => ha0) (fun _ => ha1) _ n []
  -- `(n * a) ^ 2 * P - 8 * (n * a) * P = (n * a) * P * (n * a - 8) ≥ 0`.
  have hA : 0 ≤ ((n : ℝ) * a * walkProb (fun _ => a) (fun w => ¬ reachesSize k w) n [])
      * ((n : ℝ) * a - 8) :=
    mul_nonneg (mul_nonneg hs.le hP0) (by linarith)
  have hB : (0 : ℝ) ≤ 4 * ((n : ℝ) * a) * a := by positivity
  have hC : (n : ℝ) * a * (8 * walkProb (fun _ => a) (fun w => ¬ reachesSize k w) n [])
      ≤ (n : ℝ) * a * 4 := by nlinarith [hcheb, hA, hB]
  have hD : 8 * walkProb (fun _ => a) (fun w => ¬ reachesSize k w) n [] ≤ 4 :=
    le_of_mul_le_mul_left hC hs
  have hcompl := walkProb_add_compl (fun _ => a) (reachesSize k) n []
  show (1 / 2 : ℝ) ≤ walkProb (fun _ => a) (reachesSize k) n []
  linarith

/-- A step count that realises the estimate at every target size. -/
noncomputable def steps (a : ℝ) (k : ℕ) : ℕ := ⌈(2 * (k : ℝ) + 8) / a⌉₊

theorem le_steps_mul (a : ℝ) (ha : 0 < a) (k : ℕ) :
    2 * (k : ℝ) + 8 ≤ (steps a k : ℝ) * a := by
  have h1 : (2 * (k : ℝ) + 8) / a ≤ (steps a k : ℝ) := Nat.le_ceil _
  have h2 : ((2 * (k : ℝ) + 8) / a) * a ≤ (steps a k : ℝ) * a :=
    mul_le_mul_of_nonneg_right h1 ha.le
  rwa [div_mul_cancel₀ _ (ne_of_gt ha)] at h2

theorem half_le_bernoulliReachProb_steps (a : ℝ) (ha0 : 0 < a) (ha1 : a ≤ 1) (k : ℕ) :
    (1 / 2 : ℝ) ≤ bernoulliReachProb a (reachesSize k) (steps a k) :=
  half_le_bernoulliReachProb a ha0.le ha1 k (steps a k) (le_steps_mul a ha0 k)

/-- The uniform bound, with the constant and the step count produced. -/
theorem exists_uniform_bernoulliReachProb (a : ℝ) (ha0 : 0 < a) (ha1 : a ≤ 1) :
    ∃ (c : ℝ) (st : ℕ → ℕ), 0 < c ∧
      ∀ k : ℕ, c ≤ bernoulliReachProb a (reachesSize k) (st k) :=
  ⟨1 / 2, steps a, by norm_num, half_le_bernoulliReachProb_steps a ha0 ha1⟩

/-- **The hypothesis `hbern`, discharged.**  This is the exact shape asked for by
`KNAll.Site.SiteWalk.thetaSiteOn_pos` and `KNAll.Site.MacroGeom.thetaSiteOn_pos_of_runJoin`: a
single positive `c` and a single step count serving every target size `k`.  The one thing the two
theorems do not already assume is `rho < 1`, and by `not_exists_uniform_at_rho_one` that cannot be
dropped. -/
theorem exists_steps_bernoulliReachProb_one_sub {rho : ℝ} (h0 : 0 ≤ rho) (h1 : rho < 1) :
    ∃ (c : ℝ) (st : ℕ → ℕ), 0 < c ∧
      ∀ k : ℕ, c ≤ bernoulliReachProb (1 - rho) (reachesSize k) (st k) :=
  exists_uniform_bernoulliReachProb (1 - rho) (by linarith) (by linarith)

/-- The version with the constant and the step count written out. -/
theorem half_le_bernoulliReachProb_one_sub {rho : ℝ} (h0 : 0 ≤ rho) (h1 : rho < 1) (k : ℕ) :
    (1 / 2 : ℝ) ≤ bernoulliReachProb (1 - rho) (reachesSize k) (steps (1 - rho) k) :=
  half_le_bernoulliReachProb_steps (1 - rho) (by linarith) (by linarith) k

/-! ## The endpoint `rho = 1` -/

/-- At parameter `0` no letter is ever `true`, so no positive target size is ever reached. -/
theorem walkProb_param_zero (k : ℕ) (n : ℕ) (h : List Bool) (hh : numJoined h < k) :
    walkProb (fun _ => (0 : ℝ)) (reachesSize k) n h = 0 := by
  classical
  induction n generalizing h with
  | zero =>
    rw [walkProb_zero, if_neg]
    exact fun hc => absurd (hc : k ≤ numJoined h) (Nat.not_le.mpr hh)
  | succ n ih =>
    have hfalse : numJoined (h ++ [false]) < k := by rw [numJoined_snoc_false]; exact hh
    simp only [walkProb_succ]
    rw [ih (h ++ [false]) hfalse]
    ring

theorem bernoulliReachProb_zero (k : ℕ) (hk : 0 < k) (n : ℕ) :
    bernoulliReachProb (0 : ℝ) (reachesSize k) n = 0 :=
  walkProb_param_zero k n [] (by rw [numJoined_nil]; exact hk)

/-- **The hypothesis is false at `rho = 1`.**  So `rho < 1` is not a convenience of the proof but
the exact range of validity, and a consumer of `hbern` has to supply it. -/
theorem not_exists_uniform_at_rho_one :
    ¬ ∃ (c : ℝ) (st : ℕ → ℕ), 0 < c ∧
        ∀ k : ℕ, c ≤ bernoulliReachProb (1 - (1 : ℝ)) (reachesSize k) (st k) := by
  rintro ⟨c, st, hc, hbound⟩
  have h1 := hbound 1
  rw [show (1 : ℝ) - 1 = 0 by norm_num, bernoulliReachProb_zero 1 Nat.one_pos] at h1
  linarith

/-! ## Non-vacuity -/

/-- `numJoined` counts the letters `true`. -/
example : numJoined [true, false, true, true] = 3 := by decide

/-- One letter, one success: the estimate is about the quantity it is supposed to be about. -/
theorem bernoulliReachProb_one_step (a : ℝ) :
    bernoulliReachProb a (reachesSize 1) 1 = a := by
  classical
  have h1 : reachesSize 1 ([] ++ [true]) := by
    show 1 ≤ numJoined ([] ++ [true])
    rw [numJoined_snoc_true, numJoined_nil]
  have h2 : ¬ reachesSize 1 ([] ++ [false]) := by
    show ¬ (1 ≤ numJoined ([] ++ [false]))
    rw [numJoined_snoc_false, numJoined_nil]
    omega
  show walkProb (fun _ => a) (reachesSize 1) 1 [] = a
  simp only [walkProb_succ, walkProb_zero]
  rw [if_pos h1, if_neg h2]
  ring

/-- Two letters, one success: `1 - (1 - a) ^ 2`.  The count runs over the whole word, not over its
last letter, and this is the smallest instance that sees the difference. -/
theorem bernoulliReachProb_two_steps (a : ℝ) :
    bernoulliReachProb a (reachesSize 1) 2 = 2 * a - a ^ 2 := by
  classical
  show walkProb (fun _ => a) (reachesSize 1) 2 [] = 2 * a - a ^ 2
  simp only [walkProb_succ, walkProb_zero, List.nil_append, List.cons_append]
  norm_num [reachesSize, numJoined]
  ring

/-- **A concrete instance with an explicit positive constant.**  At `rho = 1 / 2`, so at success
parameter `1 / 2`, the step count `4 * k + 16` reaches size `k` with probability at least `1 / 2`,
for every `k`. -/
theorem half_le_bernoulliReachProb_explicit (k : ℕ) :
    (1 / 2 : ℝ) ≤ bernoulliReachProb (1 - (1 / 2 : ℝ)) (reachesSize k) (4 * k + 16) := by
  have ha0 : (0 : ℝ) ≤ 1 - 1 / 2 := by norm_num
  have ha1 : (1 : ℝ) - 1 / 2 ≤ 1 := by norm_num
  refine half_le_bernoulliReachProb (1 - 1 / 2) ha0 ha1 k (4 * k + 16) ?_
  push_cast
  linarith

end KNAll.Site.BReach

section AxiomCheck

#print axioms KNAll.Site.BReach.mul_walkProb_le_walkExp
#print axioms KNAll.Site.BReach.walkExp_centered_sq
#print axioms KNAll.Site.BReach.mul_walkProb_not_reachesSize_le
#print axioms KNAll.Site.BReach.half_le_bernoulliReachProb
#print axioms KNAll.Site.BReach.half_le_bernoulliReachProb_steps
#print axioms KNAll.Site.BReach.exists_uniform_bernoulliReachProb
#print axioms KNAll.Site.BReach.exists_steps_bernoulliReachProb_one_sub
#print axioms KNAll.Site.BReach.bernoulliReachProb_zero
#print axioms KNAll.Site.BReach.not_exists_uniform_at_rho_one
#print axioms KNAll.Site.BReach.bernoulliReachProb_one_step
#print axioms KNAll.Site.BReach.bernoulliReachProb_two_steps
#print axioms KNAll.Site.BReach.half_le_bernoulliReachProb_explicit

end AxiomCheck
