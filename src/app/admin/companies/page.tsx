import { getCompanyList } from "@/lib/admin/queries";
import { CompanyTable } from "@/components/admin/companies/CompanyTable";
import { CompanyFilters } from "@/components/admin/companies/CompanyFilters";
import { CsvExportButton } from "@/components/admin/companies/CsvExportButton";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = str(params.search) || "";
  const page = parseInt(str(params.page) || "1", 10);
  const sortBy = str(params.sortBy) || "signup_at";
  const sortDir = str(params.sortDir) === "asc" ? "asc" as const : "desc" as const;
  const plan = str(params.plan);
  const status = str(params.status);
  const channel = str(params.channel);
  const activity = str(params.activity);
  const signupFrom = str(params.signupFrom);
  const signupTo = str(params.signupTo);

  const result = await getCompanyList({
    search,
    page: isNaN(page) ? 1 : page,
    pageSize: 50,
    sortBy,
    sortDir,
    plan: plan ? [plan] : undefined,
    status: status ? [status] : undefined,
    channel: channel ? [channel] : undefined,
    activity,
    signupFrom,
    signupTo,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Companies</h1>
        <CsvExportButton data={result.data} />
      </div>

      <CompanyFilters
        plan={plan}
        status={status}
        channel={channel}
        activity={activity}
        signupFrom={signupFrom}
        signupTo={signupTo}
      />

      <CompanyTable
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
