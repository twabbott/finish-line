﻿using System;

namespace FinishLineApi.Store.Entities
{
    public class LogEntry
    {
        public int Id { get; set; }
        public int? ProjectId { get; set; }
        public Project Project { get; set; }
        public int? WorkItemId { get; set; }
        public WorkItem WorkItem { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}