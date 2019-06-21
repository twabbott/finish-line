using System;

namespace FinishLineApi.Models
{
    public class WorkItem
    {
        public int WorkItemId { get; set; }
        public string Title { get; set; }
        public string Status { get; set; }
        public string ProjectId { get; set; }
        public Project Project { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}