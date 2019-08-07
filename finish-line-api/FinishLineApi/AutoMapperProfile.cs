using AutoMapper;

using FinishLineApi.Dto;
using FinishLineApi.Store.Entities;

namespace FinishLineApi
{
    public class AutoMapperProfile: Profile
    {
        private static IMapper _mapper = null;

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

        /// <summary>
        ///     Creates/fetches the singleton IMapper object
        /// </summary>
        public static IMapper MapperFactory()
        {
            if (_mapper != null)
            {
                return _mapper;
            }

            var mappingConfig = new MapperConfiguration(mc =>
            {
                mc.AddProfile(new AutoMapperProfile());
            });

            _mapper = mappingConfig.CreateMapper();
            return _mapper;
        }
    }
}
