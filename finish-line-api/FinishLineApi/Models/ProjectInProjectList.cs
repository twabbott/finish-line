namespace FinishLineApi.Models
{
    public class ProjectInProjectList
    {
        public int ProjectInProjectListId { get; set; }
        public int ProjectListId { get; set; }
        public Project Project { get; set; }
        public int Order { get; set; }
    }
}