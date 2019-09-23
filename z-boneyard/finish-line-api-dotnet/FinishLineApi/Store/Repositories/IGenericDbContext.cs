using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Threading;
using System.Threading.Tasks;

namespace FinishLineApi.Store.Repositories
{
    /// <summary>
    ///     Represents a constructor for a generic DbContext.  Used by the 
    ///     GenericRepository class.  This interface exposes a variety of
    ///     methods from EF's DbContext class
    /// </summary>
    public interface IGenericDbContext
    {
        DbSet<TEntity> Set<TEntity>() where TEntity : class;
        ChangeTracker ChangeTracker { get; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default(CancellationToken));
        int SaveChanges();
    }
}
