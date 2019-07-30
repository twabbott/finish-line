using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using FinishLineApi.Store.Entities;

namespace FinishLineApi.Store.Contexts
{
    public interface IFinishLineDBContext
    {
        DbSet<Project> Projects { get; set; }
        DbSet<WorkItem> WorkItems { get; set; }
        DbSet<Resource> ReferenceItems { get; set; }
        DbSet<LogEntry> LogEntries { get; set; }
        DbSet<ProjectList> ProjectLists { get; set; }
        DbSet<ProjectInProjectList> ProjectsInProjectList { get; set; }
        int CommitChanges();
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

            _logger = logger;
        }

        public DbSet<Project> Projects { get; set; }
        public DbSet<WorkItem> WorkItems { get; set; }
        public DbSet<Resource> ReferenceItems { get; set; }
        public DbSet<LogEntry> LogEntries { get; set; }
        public DbSet<ProjectList> ProjectLists { get; set; }
        public DbSet<ProjectInProjectList> ProjectsInProjectList { get; set; }

        public int CommitChanges()
        {
            int count = 0;
            try
            {
                count = SaveChanges();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException ex)
            {
                if (string.IsNullOrEmpty(ex.Message) || !ex.Message.StartsWith("Database operation expected to affect 1 row(s)"))
                    throw;
            }

            return count;
        }
    }
}
