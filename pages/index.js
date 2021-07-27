import { Box, Container, Grid, Grow, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert, Pagination } from '@material-ui/lab';
import Router from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';
import { FaPlusCircle } from 'react-icons/fa';
import scrollIntoView from 'scroll-into-view-if-needed';
import { iconTool } from '../src/constants';
import { FadeIn } from '../src/components';
import api from '../src/api';
import {
  Footer,
  Header,
  Link,
  LinkedSample,
  Results,
  Top4Results,
  SearchBar,
  TagChipBar,
  TagFilter
} from '../src/components';
import { useRequest } from '../src/hooks';

const useStyles = makeStyles((theme) => ({
  hero: {
    [theme.breakpoints.down('xs')]: {
      backgroundSize: '48%'
    },
    [theme.breakpoints.up('sm')]: {
      backgroundSize: '28%'
    },
    backgroundColor: theme.palette.background.default,
    color: '#fff',
    textAlign: 'left',
    paddingLeft: theme.spacing(8),
    '& h3': {
      margin: theme.spacing(3, 0),
      fontWeight: 800,
      [theme.breakpoints.down('sm')]: {
        fontSize: '2.6rem'
      }
    }
  },
  iconArea: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: theme.spacing(2)
  },
  title: {
    marginTop: theme.spacing(4)
  },
  iconTool: {
    width: '100px',
    height: '100px',
    padding: '10px',
    cursor: 'pointer',
    '& :hover': {
      transition: 'all 0.5s ease-in-out'

    },
  //   '@keyframes fadein': {
  //     from: { opacity: 0 },
  //     to:   { opacity: 1 }
  // }
  },
  addApp: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: theme.spacing(8),
    paddingRight: theme.spacing(9),
  },
  executeTime: {
    fontWeight: 400
  },
  executeTimeBox: {
    backgroundColor: theme.palette.executionTimeBackground,
    display: 'inline-block',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(2),
    marginLeft: theme.spacing(0.5),
    boxShadow: '0 1px 5px 0 rgba(0,0,0,.07)'
  },
  addYourAppBox: {
    margin: theme.spacing(0, 'auto')
  },
  addYourAppLink: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    paddingTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    fontWeight: 500,
  },
  icon: {
    height: '40px',
    width: '40px',
    marginRight: theme.spacing(1),
    color: '#d81b2d',
  },
  cardArea: {
    paddingLeft: theme.spacing(10),
    paddingRight: theme.spacing(10),
  },
  featuredApps: {
    color: theme.palette.text.secondary,
    fontSize: '24px',
    fontWeight: '700',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  pagination: {
    marginBottom: theme.spacing(4),
    '& .Mui-selected': {
      backgroundColor: '#d81b2d',
      color:'#fff',
     },
     '& .MuiPaginationItem-page': {
      color:'#fff',
     },
  }
}));

const LIMIT = 16;

function Index({ initialProjectsData, linkedSampleData, filtersData }) {
  const classes = useStyles();

  // linkedSample can come from query param (serverside) or by the search bar on clicking a suggestion
  const [linkedSample, setLinkedSample] = useState(linkedSampleData);
  const [linkedSampleIsOpened, setLinkedSampleIsOpened] = useState(!!linkedSampleData);

  const openLinkedSample = useCallback((sample) => {
    setLinkedSample(sample);
    setLinkedSampleIsOpened(true);
    Router.push(
      {
        pathname: '/',
        query: { id: sample.id }
      },
      null,
      { scroll: false, shallow: true }
    );
  }, []);

  const closeLinkedSample = useCallback(() => {
    setLinkedSampleIsOpened(false);
    Router.push({ pathname: '/' }, null, { scroll: false, shallow: true });
  }, []);

  // Query params for the /projects
  const [textFilter, setTextFilter] = useState();
  const [offset, setOffset] = useState(0);
  const [tags, setTags] = useState({});
  const projectsParams = useMemo(
    () => ({
      offset,
      limit: LIMIT,
      ...Object.keys(tags).reduce(
        (selectedTags, filter) => ({
          ...selectedTags,
          [filter]: Object.keys(tags[filter]).filter((tag) => tags[filter][tag])
        }),
        {}
      ),
      ...(textFilter
        ? {
            text_filter: textFilter
          }
        : {}),
      sortBy: 'rank'
    }),
    [offset, tags, textFilter]
  );

  // Get Sample Projects
  const { data, loading, error } = useRequest({
    url: '/projects',
    params: projectsParams,
    skipFirstFetch: true, // first data (without filters) is loaded server side form initialProjectsData
    initialData: initialProjectsData
  });

  // Pagination
  const page = useMemo(() => Math.floor(offset / LIMIT) + 1, [offset]);
  const maxPage = useMemo(() => Math.floor((data?.totalResults || 0) / LIMIT) + 1, [
    data?.totalResults
  ]);

  const changePage = useCallback((e, newPage) => {
    setOffset((newPage - 1) * LIMIT);
    scrollIntoView(document.getElementById('top-of-results'), {
      scrollMode: 'if-needed',
      block: 'start',
      behavior: 'smooth'
    });
  }, []);

  const [searchFlag, setSearchFlag] = useState(false)

  // Filtering
  const updateTextFilter = useCallback((text) => {
    setOffset(0);
    setTextFilter(text);
    if(text.length > 0){
      setSearchFlag(true)
    }
    else if(!text || text.length === 0){
      setSearchFlag(false)
    }
  }, []);

  const updateTags = useCallback((tags) => {
    setOffset(0);
    setTags(tags);
  }, []);

  const updateTag = useCallback(
    ({ filter, tag, value }) => {
      updateTags((tags) => ({
        ...tags,
        [filter]: {
          ...tags[filter],
          [tag]: value
        }
      }));
    },
    [updateTags]
  );

  const clearFilters = useCallback(() => {
    setOffset(0);
    setTags({});
    setTextFilter();
  }, []);

  const showExecutionTime = useMemo(
    () =>
      textFilter ||
      Object.keys(tags).some((filter) =>
        Object.keys(tags[filter]).some((tag) => tags[filter][tag])
      ),
    [tags, textFilter]
  );

  return (
    <Box mt={9}>
      <Header />
      <Box className={classes.hero} px={{ xs: 1, md: 6 }} pt={{ xs: 1, md: 6 }} pb={0} mt={2}>
        <Grid direction="row" className={classes.iconArea} container>
          <Grid item md={3.5} className={classes.title}>
            <Typography variant="h3">Redis <br/> Marketplace</Typography>
            <Typography variant="body1">
              See what you can build with Redis.<br/> Get started with code samples.
            </Typography>
          </Grid>
          <Grid item md={8.5}>
            <Grid direction="row" container>  
            {iconTool[0].row.map(({ label, imgSrc, link }) => (          
              <Grid item md={1.5}>
                <FadeIn>
                  <img className={classes.iconTool} src={imgSrc} alt=""/>
                </FadeIn>
              </Grid>
            ))}
            </Grid>
            <Grid direction="row" container>  
            {iconTool[1].row.map(({ label, imgSrc, link }) => (          
              <Grid item md={1.5}>
                <FadeIn>
                  <img className={classes.iconTool} src={imgSrc} alt=""/>
                </FadeIn>
              </Grid>
            ))}
            </Grid>
            <Grid direction="row" container>  
            {iconTool[2].row.map(({ label, imgSrc, link }) => (          
              <Grid item md={1.5}>
                <FadeIn>
                  <img className={classes.iconTool} src={imgSrc} alt=""/>
                </FadeIn>
              </Grid>
            ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Box className={classes.addApp} px={{ xs: 1, md: 6 }} pt={{ xs: 1, md: 6 }}>
        <Grid direction="row" container>
          <Grid item md={2}>
            <Link
              href="https://github.com/redis-developer/adding-apps-to-redis-marketplace"
              target="_blank"
              className={classes.addYourAppLink}>
              <FaPlusCircle className={classes.icon} mt={4}/> Add your App
            </Link>
          </Grid>
          <Grid item md={10}>
            <SearchBar updateTextFilter={updateTextFilter} openLinkedSample={openLinkedSample} />
            <Grow in={showExecutionTime} appear={false}>
              <Box className={classes.executeTimeBox}>
                <Typography variant="body2" className={classes.executeTime}>
                  Search time: {data?.executeTime || 0} secs
                </Typography>
              </Box>
            </Grow>
          </Grid>
        </Grid>
      </Box>
      <div className={classes.cardArea}>
        {linkedSample && (
          <LinkedSample
            sample={linkedSample}
            closeLinkedSample={closeLinkedSample}
            updateTags={updateTags}
            isOpened={linkedSampleIsOpened}
          />
        )}
        <Grid container spacing={1}>
          <Box clone order={{ xs: 2, sm: 2, md: 3 }}>
            <Grid item md={2}>
              <TagFilter updateTag={updateTag} tags={tags} filtersData={filtersData} />
            </Grid>
          </Box>
          <Box clone order={4}>
            <Grid item md={10} style={{ position: 'relative' }}> 
              {
                searchFlag === false ?
                  <>
                  <Grid direction="row" className={classes.featuredApps}>
                    Lorem Ipsum Dolor Sit Amet Consectetur
                  </Grid>
                  <Grid direction="row">
                    <Top4Results samples={data?.rows} updateTags={updateTags} limit={4} />
                  </Grid>
                  </>
                  :
                  null
              }
              <Grid direction="row" className={classes.featuredApps}>
                Adipiscing Elit Mauris Sed Metus Est
              </Grid>
              <div id="top-of-results" style={{ position: 'absolute', top: '-100px', left: '0' }} />
              {error ? (
                <Alert severity="error">Server Error. Please try again later!</Alert>
              ) : (
                <Results samples={data?.rows} updateTags={updateTags} limit={LIMIT} />
              )}
              {data && !error && (
                <Grid className={classes.pagination} container justify="center">
                  <Pagination
                    count={maxPage}
                    page={page}
                    onChange={changePage}
                    disabled={loading}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>
      </div>
      <Footer />
    </Box>
  );
}

export async function getServerSideProps({ query }) {
  // Get first page of the browser without filters
  const { data: initialProjectsData } = await api.get('/projects', {
    params: { limit: LIMIT }
  });

  // Get dynamic filter
  const { data: filtersData } = await api.get('/projects/filters');

  // Get linked project from query
  let linkedSampleData = null;
  if (query.id) {
    const linkedProjectResponse = await api.get(`/project/${query.id}`);
    linkedSampleData = linkedProjectResponse.data;
  }

  return { props: { initialProjectsData, linkedSampleData, filtersData } };
}

export default Index;
