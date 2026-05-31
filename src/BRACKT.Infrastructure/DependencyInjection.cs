using Brackt.Application.Abstractions;
using Brackt.Application.Configuration;
using Brackt.Infrastructure.Persistence;
using Brackt.Infrastructure.Security;
using Brackt.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Brackt.Infrastructure;

/// <summary>
/// Composition root for the Infrastructure layer. The API host calls
/// <see cref="AddInfrastructure"/> to register persistence, security and the
/// application service implementations in one place.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Missing connection string 'Default'.");

        services.AddDbContext<BracktDbContext>(options => options.UseSqlServer(connectionString));

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        services.AddScoped<IPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITournamentService, TournamentService>();

        return services;
    }
}
