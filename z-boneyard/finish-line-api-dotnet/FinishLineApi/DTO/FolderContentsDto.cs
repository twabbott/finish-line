using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.DTO
{
    public class FolderContentsDto
    {
        public FolderDto Folder { get; set; }

        public List<FolderDto> Subfolders { get; set; }

        public List<ProjectDto> Projects { get; set; }
    }
}
