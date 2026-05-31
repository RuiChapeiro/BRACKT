using Brackt.Domain.Communication;
using Brackt.Domain.Logistics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Brackt.Infrastructure.Persistence.Configurations;

internal sealed class VenueConfiguration : IEntityTypeConfiguration<Venue>
{
    public void Configure(EntityTypeBuilder<Venue> builder)
    {
        builder.ToTable("Venues");
        builder.ConfigureAggregateRoot();
        builder.Property(v => v.Name).IsRequired().HasMaxLength(120);

        builder.OwnsMany(v => v.Slots, b =>
        {
            b.ToTable("VenueSlots");
            b.HasKey(s => s.Id);
            b.Property(s => s.Id).ValueGeneratedNever();
            b.WithOwner().HasForeignKey(s => s.VenueId);
            b.HasIndex(s => new { s.VenueId, s.StartUtc });
        });
        builder.Navigation(v => v.Slots).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class ScheduleConflictConfiguration : IEntityTypeConfiguration<ScheduleConflict>
{
    public void Configure(EntityTypeBuilder<ScheduleConflict> builder)
    {
        builder.ToTable("ScheduleConflicts");
        builder.ConfigureAggregateRoot();
        builder.Property(c => c.Type).HasConversion<string>().HasMaxLength(32);
        builder.Property(c => c.Severity).HasConversion<string>().HasMaxLength(12);
        builder.Property(c => c.Message).IsRequired().HasMaxLength(400);
        builder.HasIndex(c => new { c.TournamentId, c.IsResolved });
    }
}

internal sealed class CheckInConfiguration : IEntityTypeConfiguration<CheckIn>
{
    public void Configure(EntityTypeBuilder<CheckIn> builder)
    {
        builder.ToTable("CheckIns");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.SubjectType).HasConversion<string>().HasMaxLength(12);
        builder.HasIndex(c => new { c.MatchParticipantId, c.SubjectId }).IsUnique();
    }
}

internal sealed class AnnouncementConfiguration : IEntityTypeConfiguration<Announcement>
{
    public void Configure(EntityTypeBuilder<Announcement> builder)
    {
        builder.ToTable("Announcements");
        builder.ConfigureAggregateRoot();
        builder.Property(a => a.Title).IsRequired().HasMaxLength(160);
        builder.Property(a => a.Body).IsRequired().HasMaxLength(4000);
        builder.Property(a => a.LinkUrl).HasMaxLength(512);
        builder.HasIndex(a => new { a.TournamentId, a.IsPublished, a.IsPinned });
    }
}

internal sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.ConfigureAggregateRoot();
        builder.Property(n => n.Type).IsRequired().HasMaxLength(48);
        builder.Property(n => n.Title).IsRequired().HasMaxLength(160);
        builder.Property(n => n.Body).IsRequired().HasMaxLength(1000);
        builder.Property(n => n.DeepLink).HasMaxLength(512);
        builder.HasIndex(n => new { n.RecipientUserId, n.IsRead });
    }
}
