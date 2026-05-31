using Brackt.Domain.Teams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Brackt.Infrastructure.Persistence.Configurations;

internal sealed class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> builder)
    {
        builder.ToTable("Teams");
        builder.ConfigureAggregateRoot();

        builder.Property(t => t.Name).IsRequired().HasMaxLength(120);
        builder.Property(t => t.Tag).HasMaxLength(12);
        builder.Property(t => t.Tier).HasConversion<string>().HasMaxLength(16);

        // Roster members are owned by the team aggregate.
        builder.OwnsMany(t => t.Members, b =>
        {
            b.ToTable("TeamMembers");
            b.HasKey(m => m.Id);
            b.Property(m => m.Id).ValueGeneratedNever();
            b.Property(m => m.JerseyNumber).HasMaxLength(8);
            b.Property(m => m.Position).HasMaxLength(64);
            b.WithOwner().HasForeignKey(m => m.TeamId);
            b.HasIndex(m => new { m.TeamId, m.PlayerId }).IsUnique();
        });
        builder.Navigation(t => t.Members).UsePropertyAccessMode(PropertyAccessMode.Field);

        // Invitations have their own DbSet (token lookups) but belong to the aggregate.
        builder.HasMany(t => t.Invitations)
               .WithOne()
               .HasForeignKey(i => i.TeamId)
               .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(t => t.Invitations).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class TeamInvitationConfiguration : IEntityTypeConfiguration<TeamInvitation>
{
    public void Configure(EntityTypeBuilder<TeamInvitation> builder)
    {
        builder.ToTable("TeamInvitations");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();
        builder.Property(i => i.InviteeEmail).IsRequired().HasMaxLength(256);
        builder.Property(i => i.Token).IsRequired().HasMaxLength(64);
        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(16);
        builder.HasIndex(i => i.Token).IsUnique();   // deep-link resolution
        builder.HasIndex(i => i.InviteeEmail);
    }
}
