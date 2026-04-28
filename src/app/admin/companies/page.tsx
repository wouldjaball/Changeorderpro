import { getCompanyList } from "@/lib/admin/queries";
import { CompanyTable } from "@/components/admin/companies/CompanyTable";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const sortBy = typeof params.sortBy === "string" ? params.sortBy : "signup_at";
  const sortDir =
    typeof params.sortDir === "string" && params.sortDir === "asc" ? "asc" : "desc";

  const result = await getCompanyList({
    search,
    page: isNaN(page) ? 1 : page,
    pageSize: 50,
    sortBy,
    sortDir,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Companies</h1>
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
