using FinishLineApi.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Services
{
    public interface IFolderService
    {
        Task<FolderInfoDto> ReadItemAsync(int? id);
        Task<FolderInfoDto> CreateItemAsync(FolderInfoDto folderInfo);
    }

    public class FolderService: IFolderService
    {
        public FolderService()
        { }

        public Task<FolderInfoDto> ReadItemAsync(int? id)
        {
            return Task.FromResult<FolderInfoDto>(null);
        }

        public Task<FolderInfoDto> CreateItemAsync(FolderInfoDto folderInfo)
        {
            throw new NotImplementedException();
        }
    }
}
