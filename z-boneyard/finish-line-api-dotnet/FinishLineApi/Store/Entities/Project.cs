﻿using FinishLineApi.Store.Repositories;

namespace FinishLineApi.Store.Entities
{
    /// <summary>
    ///     A project encapsulates a manageable amount of work with a clear goal
    ///     in mind.  Projects can contain zero or more tasks (WorkItem), as well
    ///     as links to external resources
    /// </summary>
    public class Project : IEntity
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Notes { get; set; }
        public string Status { get; set; }
    }
}