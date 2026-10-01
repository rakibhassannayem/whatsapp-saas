import {
  MessageCircle,
  Tags,
  UsersRound,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: UsersRound,
    title: "Keep customer contacts organized",
    description:
      "Bring customer details into one workspace and find them when you need them.",
  },
  {
    icon: Tags,
    title: "Build focused audiences",
    description:
      "Use tags and customer selection to shape the audience for each campaign.",
  },
  {
    icon: MessageCircle,
    title: "Prepare messages consistently",
    description:
      "Save reusable message drafts and use them while preparing campaigns.",
  },
];

const Features = () => {
  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            The essentials for campaign planning
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            A clear place to manage contacts, reusable messages, and campaign
            audiences.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                className="rounded-2xl border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                key={feature.title}
              >
                <CardHeader>
                  <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="leading-6">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
