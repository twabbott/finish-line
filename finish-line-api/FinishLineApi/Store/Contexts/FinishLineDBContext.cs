using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using FinishLineApi.Store.Entities;
using System;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using FinishLineApi.Store.Repositories;

namespace FinishLineApi.Store.Contexts
{
    public interface IFinishLineDBContext: IGenericDbContext, IDisposable
    {
        DbSet<Project> Projects { get; set; }
        DbSet<Task> Tasks { get; set; }
        DbSet<Resource> ReferenceItems { get; set; }
        DbSet<WorkNote> WorkNotes { get; set; }
        DbSet<ProjectList> ProjectLists { get; set; }
        DbSet<ProjectInProjectList> ProjectsInProjectList { get; set; }
    }

    public class FinishLineDBContext: DbContext, IFinishLineDBContext, IGenericDbContext
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
            this._logger = logger;
        }

        public DbSet<Project> Projects { get; set; }
        public DbSet<Task> Tasks { get; set; }
        public DbSet<Resource> ReferenceItems { get; set; }
        public DbSet<WorkNote> WorkNotes { get; set; }
        public DbSet<ProjectList> ProjectLists { get; set; }
        public DbSet<ProjectInProjectList> ProjectsInProjectList { get; set; }
    }
}
