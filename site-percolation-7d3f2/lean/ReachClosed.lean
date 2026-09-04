import KN.BernoulliReach
import KN.SiteMacroGeometry

/-!
# The reach hypothesis, discharged

`SiteWalk.thetaSiteOn_pos` and `MacroGeom.thetaSiteOn_pos_of_runJoin` each carry a hypothesis
asking for a uniform lower bound on the Bernoulli reach probability, which nothing in the
development supplied.  `KN/BernoulliReach.lean` proves it, uniformly in the target size, together
with the fact that it FAILS at `rho = 1`.  So the two theorems are restated here with `rho < 1`
in place of `rho ≤ 1` and with the reach hypothesis removed.

The strengthening costs nothing: `SiteWalk.NextBound S 1` unfolds to the nonnegativity of a
probability, so a one-step contract at `rho = 1` carries no information in any case.

WARNING, established after this file was written.  `KN/BlockGluing.lean` proves
`one_le_of_nextBound_of_runJoin`: for any exploration whose joining implies connection to the
root, `RunJoin` together with `NextBound rho` forces `1 ≤ rho`.  So the hypotheses of
`thetaSiteOn_pos_of_runJoin'` below, which include `rho < 1`, are CONTRADICTORY, and the theorem
is vacuous.  The same frontier argument caps the one-step contract of `thetaSiteOn_pos'` at the
density.  The reach estimate discharged here is correct and reusable; the exploration design it
was attached to is not.  The renormalisation proceeds instead by exploring the actual cluster
with thick shells (`KN/TargetExtension.lean`, `KN/MacroExploration.lean`), whose source is a
site already inspected open, so that argument does not apply.
-/

namespace KNAll.Site

open MeasureTheory Set KN Percolation.Literature Percolation.Literature.LatticeModels

variable {d : ℕ} (S : SiteWalk d)

/-- An infinite cluster from the block exploration, with the reach hypothesis discharged. -/
theorem SiteWalk.thetaSiteOn_pos' (G : SimpleGraph (Site d)) (x : Site d) (p : unitInterval)
    (hden : S.density = fun _ => p)
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω))
    (hjoin : ∀ (m : S.Index) (ω : SiteConfig (Site d)), ω ∈ S.joined m →
      ∃ y ∈ (↑(S.block m) : Set (Site d)), y ∈ siteCluster G ω x)
    {rho : ℝ} (hrho0 : 0 ≤ rho) (hrho1 : rho < 1) (hS : S.NextBound rho) :
    0 < thetaSiteOn G x p := by
  obtain ⟨c, st, hc, hb⟩ := BReach.exists_steps_bernoulliReachProb_one_sub hrho0 hrho1
  exact S.thetaSiteOn_pos G x p hden hadm hjoin hrho0 hrho1.le hS hc st hb

/-- The same for the transcript form of the joining hypothesis. -/
theorem MacroGeom.thetaSiteOn_pos_of_runJoin' (G : SimpleGraph (Site d)) (x : Site d)
    (p : unitInterval) (hden : S.density = fun _ => p)
    (hadm : ∀ (h : MacroHistory d S.Index) (b : Bool) (ω : SiteConfig (Site d)),
      S.Admissible h → S.Admissible (S.step h b ω))
    (hrun : MacroGeom.RunJoin S G x)
    {rho : ℝ} (hrho0 : 0 ≤ rho) (hrho1 : rho < 1) (hS : S.NextBound rho) :
    0 < thetaSiteOn G x p := by
  obtain ⟨c, st, hc, hb⟩ := BReach.exists_steps_bernoulliReachProb_one_sub hrho0 hrho1
  exact MacroGeom.thetaSiteOn_pos_of_runJoin S G x p hden hadm hrun hrho0 hrho1.le hS hc st hb

end KNAll.Site
