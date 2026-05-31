using Brackt.Domain.Identity;
using Brackt.Domain.Players;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Brackt.Infrastructure.Persistence.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.ConfigureAggregateRoot();

        builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.DisplayName).IsRequired().HasMaxLength(120);
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(32);

        // One account ↔ one native player.
        builder.HasIndex(u => u.PlayerId).IsUnique();

        // External logins are part of the User aggregate (no independent lifecycle).
        builder.OwnsMany(u => u.ExternalLogins, b =>
        {
            b.ToTable("ExternalLogins");
            b.HasKey(e => e.Id);
            b.Property(e => e.Id).ValueGeneratedNever();
            b.Property(e => e.Provider).IsRequired().HasMaxLength(64);
            b.Property(e => e.ProviderKey).IsRequired().HasMaxLength(256);
            b.WithOwner().HasForeignKey(e => e.UserId);
            b.HasIndex(e => new { e.Provider, e.ProviderKey }).IsUnique();
        });
        builder.Navigation(u => u.ExternalLogins).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class PlayerConfiguration : IEntityTypeConfiguration<Player>
{
    public void Configure(EntityTypeBuilder<Player> builder)
    {
        builder.ToTable("Players");
        builder.ConfigureAggregateRoot();

        builder.Property(p => p.DisplayName).IsRequired().HasMaxLength(120);
        builder.Property(p => p.Handle).HasMaxLength(64);
        builder.Property(p => p.CountryCode).HasMaxLength(3);
        builder.Property(p => p.State).HasConversion<string>().HasMaxLength(16);

        builder.HasIndex(p => p.Handle).IsUnique().HasFilter("[Handle] IS NOT NULL");
        builder.HasIndex(p => p.UserId);

        // RF1.3 — self-referencing redirect for a claimed/merged ghost.
        builder.HasOne<Player>()
               .WithMany()
               .HasForeignKey(p => p.MergedIntoPlayerId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
