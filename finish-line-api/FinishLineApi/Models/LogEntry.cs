using System;

namespace FinishLineApi.Models
{
    public class LogEntry
    {
        public int LogEntryId { get; set; }
        public int? ProjectId { get; set; }
        public Project Project { get; set; }
        public int? WorkItemId { get; set; }
        public WorkItem WorkItem { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}