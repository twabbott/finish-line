namespace FinishLineApi.Models
{
    /// <summary>
    ///     A project encapsulates a manageable amount of work with a clear goal
    ///     in mind.  Projects can contain zero or more tasks (WorkItem), as well
    ///     as links to external resources
    /// </summary>
    public class Project
    {
        public int ProjectId { get; set; }
        public string Title { get; set; }
        public string Notes { get; set; }
        public string Status { get; set; }
    }
}