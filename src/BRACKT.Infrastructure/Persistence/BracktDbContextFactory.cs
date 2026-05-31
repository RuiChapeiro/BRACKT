using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Brackt.Infrastructure.Persistence;

/// <summary>
/// Design-time factory used by the EF Core CLI (`dotnet ef migrations`,
/// `dotnet ef database update`) to instantiate the context WITHOUT a running
/// application host. The real API host will instead register the context via DI
/// with configuration-bound options; this factory exists solely for tooling.
///
/// The connection string can be overridden with the BRACKT_DB_CONNECTION
/// environment variable; otherwise it defaults to the local SQL Server LocalDB
/// instance with a database named "BRACKT.Db".
/// </summary>
public sealed class BracktDbContextFactory : IDesignTimeDbContextFactory<BracktDbContext>
{
    private const string DefaultConnection =
        @"Server=(localdb)\MSSQLLocalDB;Database=BRACKT.Db;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=true";

    public BracktDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("BRACKT_DB_CONNECTION") ?? DefaultConnection;

        var options = new DbContextOptionsBuilder<BracktDbContext>()
            .UseSqlServer(connection, sql => sql.MigrationsAssembly(typeof(BracktDbContextFactory).Assembly.FullName))
            .Options;

        // No dispatcher needed at design time.
        return new BracktDbContext(options);
    }
}
