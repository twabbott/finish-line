using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.DTO
{
    public class FolderDto
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int ParentId { get; set; }

        public string Name { get; set; }

        public List<FolderDto> Subfolders { get; set; }

        public List<ProjectDto> Projects { get; set; }
    }
}
