namespace Brackt.Domain.Engine;

/// <summary>
/// Pure seeding maths shared by the bracket generators. Stateless and
/// deterministic (given a supplied <see cref="Random"/>), so it is trivially
/// unit-testable.
/// </summary>
public static class SeedingHelper
{
    /// <summary>Smallest power of two ≥ <paramref name="n"/> (minimum 2).</summary>
    public static int NextPowerOfTwo(int n)
    {
        if (n < 2) return 2;
        var size = 1;
        while (size < n) size <<= 1;
        return size;
    }

    public static int Log2(int powerOfTwo) => (int)Math.Log2(powerOfTwo);

    /// <summary>
    /// Standard single-elimination seed placement for a bracket of
    /// <paramref name="size"/> slots (a power of two). Returns the seed NUMBER
    /// (1-based) occupying each slot, ordered so that consecutive pairs are
    /// opponents: slot[0] vs slot[1], slot[2] vs slot[3], …
    ///
    /// The recurrence mirrors how brackets are drawn by hand — at each doubling,
    /// every existing seed <c>s</c> is paired with its complement
    /// <c>(2·len + 1 − s)</c> — yielding the canonical 1-vs-N, 2-vs-(N-1) pattern
    /// where top seeds only meet in the final.
    ///   size 8 → [1, 8, 4, 5, 2, 7, 3, 6]  ⇒  (1v8)(4v5)(2v7)(3v6)
    /// </summary>
    public static int[] StandardBracketSeedOrder(int size)
    {
        if (size < 2 || (size & (size - 1)) != 0)
            throw new ArgumentException("Bracket size must be a power of two ≥ 2.", nameof(size));

        var order = new[] { 1 };
        while (order.Length < size)
        {
            var sum = order.Length * 2 + 1;
            var next = new int[order.Length * 2];
            for (var i = 0; i < order.Length; i++)
            {
                next[2 * i] = order[i];
                next[2 * i + 1] = sum - order[i];
            }
            order = next;
        }
        return order;
    }

    /// <summary>In-place Fisher–Yates shuffle (RF3.3 random seeding).</summary>
    public static IList<T> Shuffle<T>(IList<T> items, Random rng)
    {
        for (var i = items.Count - 1; i > 0; i--)
        {
            var j = rng.Next(i + 1);
            (items[i], items[j]) = (items[j], items[i]);
        }
        return items;
    }
}
