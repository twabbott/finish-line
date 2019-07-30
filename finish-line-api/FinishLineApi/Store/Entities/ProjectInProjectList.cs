namespace FinishLineApi.Store.Entities
{
    public class ProjectInProjectList
    {
        public int Id { get; set; }
        public int ProjectInProjectListId { get; set; }
        public int ProjectListId { get; set; }
        public Project Project { get; set; }
        public int Order { get; set; }
    }
}