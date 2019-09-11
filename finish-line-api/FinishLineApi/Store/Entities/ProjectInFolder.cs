using FinishLineApi.Store.Repositories;

namespace FinishLineApi.Store.Entities
{
    public class ProjectInFolder : IEntity
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Project Project { get; set; }
        public int FolderId { get; set; }
        public Folder Folder { get; set; }
        public int Order { get; set; }
    }
}