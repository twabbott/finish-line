using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using FinishLineApi.Dto;
using FinishLineApi.Models;

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
