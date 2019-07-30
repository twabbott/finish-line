using AutoMapper;

using FinishLineApi.Dto;
using FinishLineApi.Store.Entities;

namespace FinishLineApi
{
    public class AutoMapperProfile: Profile
    {
        public AutoMapperProfile()
        {
            // All mappings are uni-directional, so if you need to map both ways
            // then you need to specify both mappings.
            CreateMap<LogEntry, LogEntryDto>()
                .ForMember(
                    dest => dest.Id,
                    opt => opt.MapFrom(src => src.Id));
            CreateMap<LogEntryDto, LogEntry>();
        }
    }
}
