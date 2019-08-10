using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using FinishLineApi.Store.Entities;
using System;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FinishLineApi.Store.Contexts
{
    public interface IFinishLineDBContext: IDisposable
    {
        DbSet<Project> Projects { get; set; }
        DbSet<Task> Tasks { get; set; }
        DbSet<Resource> ReferenceItems { get; set; }
        DbSet<WorkNote> WorkNotes { get; set; }
        DbSet<ProjectList> ProjectLists { get; set; }
        DbSet<ProjectInProjectList> ProjectsInProjectList { get; set; }

        EntityEntry<TEntity> Attach<TEntity>(TEntity entity) where TEntity : class;
        EntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class;
        EntityEntry<TEntity> Update<TEntity>(TEntity entity) where TEntity : class;
        EntityEntry<TEntity> Remove<TEntity>(TEntity entity) where TEntity : class;
        bool CommitChanges();
    }

    public class FinishLineDBContext: DbContext, IFinishLineDBContext
    {
        private readonly ILogger<FinishLineDBContext> _logger;

        public FinishLineDBContext(DbContextOptions<FinishLineDBContext> options, ILogger<FinishLineDBContext> logger, IHostingEnvironment env)
            : base(options)
        {
            if (env.IsDevelopment())
            {
                // This actually creates and initializes the database.
                Database.EnsureCreated();
            }
            this.
            _logger = logger;
        }

        public DbSet<Project> Projects { get; set; }
        public DbSet<Task> Tasks { get; set; }
        public DbSet<Resource> ReferenceItems { get; set; }
        public DbSet<WorkNote> WorkNotes { get; set; }
        public DbSet<ProjectList> ProjectLists { get; set; }
        public DbSet<ProjectInProjectList> ProjectsInProjectList { get; set; }

        public bool CommitChanges()
        {
            if (!ChangeTracker.HasChanges())
            {
                return true;
            }

            int count = 0;
            try
            {
                count = SaveChanges();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException ex)
            {
                if (string.IsNullOrEmpty(ex.Message) || 
                    (!ex.Message.StartsWith("Database operation expected to affect 1 row(s)") && // This one comes from SQL server
                    ex.Message != "Attempted to update or delete an entity that does not exist in the store.")) // This one comes from EF in-memory db
                    throw;
            }

            return count > 0;
        }
    }
}
