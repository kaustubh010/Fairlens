'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { SCORING_FORMULAS, SCORE_THRESHOLDS } from '@/lib/behavioral/scoring';

export function MethodologyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Info className="mr-2 h-4 w-4" />
          How scoring works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Scoring methodology and formulas</DialogTitle>
          <DialogDescription>
            FairLens uses behavioral asymmetry scoring on paired prompts. Scores indicate signal strength, not legal verdicts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <section>
            <h4 className="font-semibold mb-2">Dimensions</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>Sentiment Delta: <code>{SCORING_FORMULAS.sentimentDelta}</code></li>
              <li>Tone Delta: <code>{SCORING_FORMULAS.toneDelta}</code></li>
              <li>Length Asymmetry: <code>{SCORING_FORMULAS.lengthAsymmetry}</code></li>
              <li>Hedge Asymmetry: <code>{SCORING_FORMULAS.hedgeAsymmetry}</code></li>
              <li>Refusal Asymmetry: <code>{SCORING_FORMULAS.refusalAsymmetry}</code></li>
              <li>Gender Attribution Delta: <code>{SCORING_FORMULAS.genderAttributionDelta}</code></li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold mb-2">Composite BSS</h4>
            <p className="text-muted-foreground">
              <code>{SCORING_FORMULAS.bss}</code>
            </p>
            <p className="text-muted-foreground mt-2">
              Flags trigger at dimension delta ≥ {SCORE_THRESHOLDS.dimensionFlag} and refusal asymmetry ≥ {SCORE_THRESHOLDS.refusalFlag}.
            </p>
          </section>

          <section>
            <h4 className="font-semibold mb-2">Interpretation bands</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>0–39: lower asymmetry signal</li>
              <li>40–64: moderate asymmetry signal</li>
              <li>65–100: high asymmetry signal</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold mb-2">Caveats</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>Not all asymmetry is bias; factual context can legitimately differ.</li>
              <li>Prompt wording quality strongly affects measured asymmetry.</li>
              <li>Use temperature 0 and repeated runs for better reproducibility.</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

