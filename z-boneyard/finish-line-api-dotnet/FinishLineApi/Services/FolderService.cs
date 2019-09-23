using FinishLineApi.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Services
{
    public interface IFolderService
    {
        Task<FolderContentsDto> ReadContentsAsync(int? id);
        Task<FolderDto> CreateItemAsync(FolderDto folderInfo);
    }

    public class FolderService: IFolderService
    {
        public FolderService()
        { }

        public Task<FolderContentsDto> ReadContentsAsync(int? id)
        {
            return Task.FromResult<FolderContentsDto>(null);
        }

        public Task<FolderDto> CreateItemAsync(FolderDto folderInfo)
        {
            throw new NotImplementedException();
        }
    }
}
