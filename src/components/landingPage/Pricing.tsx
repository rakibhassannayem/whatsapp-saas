import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    description:
      "For businesses beginning to organize their customer contacts.",
  },
  {
    name: "Growth",
    description: "For teams preparing campaigns for more focused audiences.",
  },
  {
    name: "Scale",
    description: "For businesses planning a larger messaging workflow.",
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Plans that can grow with your business
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Pricing and plan limits are being finalized. Contact us to discuss
            what your business needs.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <Card className="rounded-2xl border-slate-200" key={plan.name}>
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full">
                  Plan details coming soon
                </Badge>
                <CardTitle className="pt-2 text-xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-12 leading-6">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href="#contact"
                >
                  Ask about pricing
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
