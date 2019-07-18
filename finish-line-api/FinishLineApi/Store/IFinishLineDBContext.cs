using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Models
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
}
