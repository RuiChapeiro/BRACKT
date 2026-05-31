using Brackt.Domain.Tournaments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Brackt.Infrastructure.Persistence.Configurations;

internal sealed class TournamentConfiguration : IEntityTypeConfiguration<Tournament>
{
    public void Configure(EntityTypeBuilder<Tournament> builder)
    {
        builder.ToTable("Tournaments");
        builder.ConfigureAggregateRoot();

        builder.Property(t => t.Name).IsRequired().HasMaxLength(160);
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(24);
        builder.Property(t => t.PublicRegistrationToken).IsRequired().HasMaxLength(32);
        builder.HasIndex(t => t.PublicRegistrationToken).IsUnique();   // public link resolution

        builder.HasMany(t => t.Stages)
               .WithOne()
               .HasForeignKey(s => s.TournamentId)
               .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(t => t.Stages).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(t => t.Registrations)
               .WithOne()
               .HasForeignKey(r => r.TournamentId)
               .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(t => t.Registrations).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class RegistrationConfiguration : IEntityTypeConfiguration<Registration>
{
    public void Configure(EntityTypeBuilder<Registration> builder)
    {
        builder.ToTable("Registrations");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();
        builder.Property(r => r.SeedLabel).IsRequired().HasMaxLength(120);
        builder.HasIndex(r => new { r.TournamentId, r.TeamId }).IsUnique();
    }
}

internal sealed class StageConfiguration : IEntityTypeConfiguration<Stage>
{
    public void Configure(EntityTypeBuilder<Stage> builder)
    {
        builder.ToTable("Stages");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();
        builder.Property(s => s.Name).IsRequired().HasMaxLength(120);
        builder.Property(s => s.Format).HasConversion<string>().HasMaxLength(24);
        builder.Property(s => s.SeedingMethod).HasConversion<string>().HasMaxLength(16);

        builder.HasMany(s => s.Groups)
               .WithOne()
               .HasForeignKey(g => g.StageId)
               .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(s => s.Groups).UsePropertyAccessMode(PropertyAccessMode.Field);

        // Seeds are owned by the stage.
        builder.OwnsMany(s => s.Seeds, b =>
        {
            b.ToTable("Seeds");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).ValueGeneratedNever();
            b.WithOwner().HasForeignKey(x => x.StageId);
            b.HasIndex(x => new { x.StageId, x.Position }).IsUnique();
        });
        builder.Navigation(s => s.Seeds).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.ToTable("Groups");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).ValueGeneratedNever();
        builder.Property(g => g.Name).IsRequired().HasMaxLength(64);

        builder.HasMany(g => g.Matches)
               .WithOne()
               .HasForeignKey(m => m.GroupId)
               .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(g => g.Matches).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class MatchConfiguration : IEntityTypeConfiguration<Match>
{
    public void Configure(EntityTypeBuilder<Match> builder)
    {
        builder.ToTable("Matches");
        builder.ConfigureAggregateRoot();

        builder.Property(m => m.BracketSide).HasConversion<string>().HasMaxLength(16);
        builder.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(m => new { m.StageId, m.RoundNumber, m.MatchNumber });

        // Self-referencing advancement wiring (winner/loser feeders).
        builder.HasOne<Match>().WithMany().HasForeignKey(m => m.NextMatchId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne<Match>().WithMany().HasForeignKey(m => m.LoserNextMatchId).OnDelete(DeleteBehavior.NoAction);

        // The two sides of the match are owned.
        builder.OwnsMany(m => m.Participants, b =>
        {
            b.ToTable("MatchParticipants");
            b.HasKey(p => p.Id);
            b.Property(p => p.Id).ValueGeneratedNever();
            b.Property(p => p.Outcome).HasConversion<string>().HasMaxLength(12);
            b.Property(p => p.Score).HasColumnType("decimal(18,4)");
            b.WithOwner().HasForeignKey(p => p.MatchId);
            b.HasIndex(p => new { p.MatchId, p.Slot }).IsUnique();
        });
        builder.Navigation(m => m.Participants).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
