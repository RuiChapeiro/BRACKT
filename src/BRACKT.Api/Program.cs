using System.Text;
using Brackt.Api.Realtime;
using Brackt.Api.Security;
using Brackt.Application.Abstractions;
using Brackt.Application.Configuration;
using Brackt.Infrastructure;
using Brackt.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ----- Application + Infrastructure services --------------------------------
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

// The DbContext fans committed domain events out over SignalR (RF6.2, live updates).
builder.Services.AddScoped<IDomainEventDispatcher, SignalRDomainEventDispatcher>();
builder.Services.AddSignalR();

builder.Services.AddControllers();

// ----- JWT authentication (RF1.1) -------------------------------------------
var jwt = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
          ?? throw new InvalidOperationException("Missing 'Jwt' configuration.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep the raw "sub" claim instead of remapping to the long XML claim type.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization();

// ----- CORS for the separated React client ----------------------------------
var clientOrigins = builder.Configuration.GetSection("Cors:ClientOrigins").Get<string[]>()
                    ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(options =>
    options.AddPolicy("client", policy =>
        policy.WithOrigins(clientOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

// ----- Swagger with bearer auth ---------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "BRACKT API", Version = "v1" });

    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the JWT from /api/auth/login (no 'Bearer ' prefix needed).",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
    };
    options.AddSecurityDefinition("Bearer", scheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { [scheme] = Array.Empty<string>() });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "BRACKT API v1"));
}

app.UseCors("client");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationsHub>("/hubs/notifications");
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "brackt-api" }));

app.Run();
