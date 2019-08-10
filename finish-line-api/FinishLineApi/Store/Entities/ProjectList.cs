using FinishLineApi.Store.Repositories;

namespace FinishLineApi.Store.Entities
{
    public class ProjectList : IEntity
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Status { get; set; }
    }
}