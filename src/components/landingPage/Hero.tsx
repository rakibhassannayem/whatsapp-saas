import { Badge } from "../ui/badge";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageCircle, Tags, UsersRound } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const Hero = () => {
  return (
    <section className="overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-20">
        <div>
          <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
            Customer messaging workspace
          </Badge>

          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Plan customer campaigns with more clarity.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Organize your contacts, prepare reusable message drafts, and choose
            a focused audience—all in one simple workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link className={buttonVariants({ size: "lg" })} href="/signup">
              Create your workspace
              <ArrowRight data-icon="inline-end" />
            </Link>

            <Link
              className={buttonVariants({ variant: "outline", size: "lg" })}
              href="#features"
            >
              Explore features
            </Link>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Start by organizing contacts and preparing campaign drafts.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-8 rounded-full bg-emerald-100/70 blur-3xl" />

          <Card className="relative overflow-hidden rounded-2xl border-slate-200 bg-white shadow-xl shadow-emerald-950/10">
            <CardHeader className="border-b bg-slate-50/80">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Campaign workspace</p>
                  <CardTitle className="mt-1 text-lg">Product update</CardTitle>
                </div>
                <Badge variant="secondary">Draft</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Message
                </p>
                <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  Hello! We have an update to share with you. Take a look
                  whenever you have a moment.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Audience
                  </p>
                  <span className="text-sm text-slate-600">
                    Select customers
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full">
                    <UsersRound data-icon="inline-start" />
                    Customers
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    <Tags data-icon="inline-start" />
                    Tagged audience
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white text-emerald-700">
                    <MessageCircle className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Ready to review
                    </p>
                    <p className="text-xs text-slate-600">
                      Message and audience in one place
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  className="size-5 text-emerald-700"
                  aria-hidden="true"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;
