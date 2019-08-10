using FinishLineApi.Store.Repositories;

namespace FinishLineApi.Store.Entities
{
    /// <summary>
    ///     A Resource is a link (URL/bookmark) or some other piece of info related to a project.
    ///     Resources are displayed at a top level in the project 
    /// </summary>
    public class Resource : IEntity
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Project Project { get; set; }
        public string Title { get; set; }
        public string Type { get; set; }
        public string Content { get; set; }
    }
}
