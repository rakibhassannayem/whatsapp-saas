import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const articles = [
  {
    category: "Customer data",
    title: "A practical way to keep customer contacts organized",
    description:
      "A short guide to bringing names, phone numbers, and customer details into one place.",
  },
  {
    category: "Audience planning",
    title: "Use tags to prepare a more focused audience",
    description:
      "Learn how customer tags can make campaign planning easier to manage.",
  },
  {
    category: "Campaigns",
    title: "From message draft to campaign plan",
    description:
      "A simple workflow for preparing a message and choosing its audience.",
  },
];

const Blog = () => {
  return (
    <section
      id="blog"
      className="scroll-mt-24 border-y bg-slate-50 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              Blog
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Notes for thoughtful customer messaging
            </h2>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full">
            Articles coming soon
          </Badge>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <Card className="rounded-2xl border-slate-200" key={article.title}>
              <CardHeader>
                <Badge variant="outline" className="w-fit rounded-full">
                  {article.category}
                </Badge>
                <CardTitle className="pt-2 text-lg leading-6">
                  {article.title}
                </CardTitle>
                <CardDescription className="leading-6">
                  {article.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
