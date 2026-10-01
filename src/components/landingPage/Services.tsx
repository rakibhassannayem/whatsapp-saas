import { FileSpreadsheet, MessageCircle, Tags } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Bring in your contacts",
    description:
      "Add customers manually or import your contact list from CSV or Excel.",
    icon: FileSpreadsheet,
  },
  {
    number: "02",
    title: "Organize with tags",
    description:
      "Group customers by the labels that make sense for your business.",
    icon: Tags,
  },
  {
    number: "03",
    title: "Prepare a campaign",
    description:
      "Choose an audience and prepare a campaign draft from a saved template.",
    icon: MessageCircle,
  },
];

const Services = () => {
  return (
    <section
      id="services"
      className="scroll-mt-24 border-y bg-slate-50 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Services
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            A simple workflow, from contacts to campaign draft
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Keep the preparation work connected, so your team can find the right
            information before a campaign is ready.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <Card className="rounded-2xl border-slate-200" key={step.number}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-700">
                      {step.number}
                    </span>
                    <Icon
                      className="size-5 text-slate-500"
                      aria-hidden="true"
                    />
                  </div>
                  <CardTitle className="pt-3 text-lg">{step.title}</CardTitle>
                  <CardDescription className="leading-6">
                    {step.description}
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

export default Services;
